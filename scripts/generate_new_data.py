import csv
import json
import math
import random
from typing import List, Dict, Tuple

def calculate_optimal_concentrators(total_points: int, min_lcus_per_concentrator: int = 450, max_lcus_per_concentrator: int = 500) -> int:
    """Calcula o número ótimo de concentradores para distribuir LCUs entre 450-500 por concentrador"""
    
    # Descontar alguns pontos que serão usados como concentradores
    available_lcus = total_points - 20  # Estimativa: 20 concentradores máximo
    
    # Calcular número ótimo visando ~475 LCUs por concentrador
    target_lcus_per_concentrator = 475
    optimal_concentrators = math.ceil(available_lcus / target_lcus_per_concentrator)
    
    # Verificar se está dentro dos limites
    avg_lcus_per_concentrator = available_lcus / optimal_concentrators
    
    if avg_lcus_per_concentrator > max_lcus_per_concentrator:
        optimal_concentrators = math.ceil(available_lcus / max_lcus_per_concentrator)
    elif avg_lcus_per_concentrator < min_lcus_per_concentrator:
        optimal_concentrators = math.ceil(available_lcus / min_lcus_per_concentrator)
    
    return optimal_concentrators

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula a distância entre dois pontos em km usando a fórmula de Haversine"""
    R = 6371  # Raio da Terra em km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def load_points_from_csv(filepath: str) -> List[Dict]:
    """Carrega os pontos do arquivo CSV"""
    points = []
    
    with open(filepath, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter=';')
        
        for row in reader:
            try:
                # Extrair dados do CSV
                fid = int(row['FID do Objeto'])
                lat = float(row['Latitude'].replace(',', '.'))
                lon = float(row['Longitude'].replace(',', '.'))
                lamp_type = row['Tipo de Lâmpada'].strip()
                power = int(row['Potência Individual da Lâmpada (W)'])
                area = row['Área do Objeto'].strip()
                
                points.append({
                    'id': fid,
                    'latitude': lat,
                    'longitude': lon,
                    'type': lamp_type,
                    'power': power,
                    'area': area
                })
            except (ValueError, KeyError) as e:
                print(f"Erro ao processar linha: {e}")
                continue
    
    return points

def select_concentrators(points: List[Dict], num_concentrators: int = None) -> List[Dict]:
    """Seleciona concentradores equidistantes usando algoritmo melhorado de distribuição geográfica"""
    
    # Se não especificado, calcular automaticamente
    if num_concentrators is None:
        num_concentrators = calculate_optimal_concentrators(len(points))
    
    print(f"🎯 Calculando {num_concentrators} concentradores para {len(points)} pontos...")
    print(f"📊 Média estimada: {(len(points) - num_concentrators) / num_concentrators:.1f} LCUs por concentrador")
    
    # Calcular centro geográfico
    center_lat = sum(p['latitude'] for p in points) / len(points)
    center_lon = sum(p['longitude'] for p in points) / len(points)
    
    # Usar algoritmo de k-means++ para melhor distribuição
    concentrators = []
    selected_ids = set()
    
    # Primeiro concentrador: mais central
    center_point = min(points, key=lambda p: calculate_distance(center_lat, center_lon, p['latitude'], p['longitude']))
    concentrators.append(center_point)
    selected_ids.add(center_point['id'])
    
    # Demais concentradores: maximizar distância dos já selecionados
    for i in range(num_concentrators - 1):
        candidates = [p for p in points if p['id'] not in selected_ids]
        
        if not candidates:
            break
        
        # Para cada candidato, calcular a distância mínima para concentradores existentes
        best_candidate = None
        max_min_distance = 0
        
        for candidate in candidates:
            min_distance = min(
                calculate_distance(candidate['latitude'], candidate['longitude'], 
                                 conc['latitude'], conc['longitude'])
                for conc in concentrators
            )
            
            if min_distance > max_min_distance:
                max_min_distance = min_distance
                best_candidate = candidate
        
        if best_candidate:
            concentrators.append(best_candidate)
            selected_ids.add(best_candidate['id'])
    
    return concentrators

def assign_relays_to_concentrators(points: List[Dict], concentrators: List[Dict]) -> Dict:
    """Atribui relés aos concentradores baseado na proximidade geográfica com distribuição balanceada"""
    
    concentrator_ids = {c['id'] for c in concentrators}
    available_points = [p for p in points if p['id'] not in concentrator_ids]
    
    result = {
        'concentrators': []
    }
    
    print(f"🔗 Atribuindo {len(available_points)} LCUs para {len(concentrators)} concentradores...")
    
    # Primeira passagem: atribuir cada LCU ao concentrador mais próximo
    concentrator_assignments = {c['id']: [] for c in concentrators}
    
    for point in available_points:
        # Encontrar concentrador mais próximo
        closest_concentrator = min(
            concentrators, 
            key=lambda c: calculate_distance(
                point['latitude'], point['longitude'], 
                c['latitude'], c['longitude']
            )
        )
        
        concentrator_assignments[closest_concentrator['id']].append({
            'id': point['id'],
            'latitude': point['latitude'],
            'longitude': point['longitude'],
            'type': point['type'],
            'power': point['power'],
            'area': point['area'],
            'distance': calculate_distance(
                point['latitude'], point['longitude'],
                closest_concentrator['latitude'], closest_concentrator['longitude']
            )
        })
    
    # Segunda passagem: balancear cargas (limitar a 500 LCUs por concentrador)
    max_lcus_per_concentrator = 500
    
    # Identificar concentradores sobrecarregados
    overloaded = {}
    for conc_id, relays in concentrator_assignments.items():
        if len(relays) > max_lcus_per_concentrator:
            # Ordenar por distância e manter apenas os mais próximos
            relays.sort(key=lambda r: r['distance'])
            overloaded[conc_id] = relays[max_lcus_per_concentrator:]
            concentrator_assignments[conc_id] = relays[:max_lcus_per_concentrator]
    
    # Redistribuir LCUs excedentes para concentradores com menos carga
    for conc_id, excess_relays in overloaded.items():
        for relay in excess_relays:
            # Encontrar concentrador com menor carga que aceite esta LCU
            best_concentrator = None
            best_distance = float('inf')
            
            for c in concentrators:
                if len(concentrator_assignments[c['id']]) < max_lcus_per_concentrator:
                    distance = calculate_distance(
                        relay['latitude'], relay['longitude'],
                        c['latitude'], c['longitude']
                    )
                    if distance < best_distance:
                        best_distance = distance
                        best_concentrator = c
            
            if best_concentrator:
                relay['distance'] = best_distance
                concentrator_assignments[best_concentrator['id']].append(relay)
    
    # Montar resultado final
    for concentrator in concentrators:
        relays = concentrator_assignments[concentrator['id']]
        
        # Remover campo 'distance' dos relés para o resultado final
        clean_relays = [{k: v for k, v in relay.items() if k != 'distance'} for relay in relays]
        
        concentrator_data = {
            'id': concentrator['id'],
            'point': {
                'id': concentrator['id'],
                'latitude': concentrator['latitude'],
                'longitude': concentrator['longitude'],
                'type': concentrator['type'],
                'power': concentrator['power'],
                'area': concentrator['area']
            },
            'relays': clean_relays
        }
        
        result['concentrators'].append(concentrator_data)
    
    return result

def main():
    print("🔄 Processando dados do CSV...")
    
    # Carregar pontos do CSV
    points = load_points_from_csv('assets/points.csv')
    print(f"✅ {len(points)} pontos carregados do CSV")
    
    if len(points) < 10:
        print("❌ Erro: Não há pontos suficientes para criar concentradores")
        return
    
    # Calcular número ótimo de concentradores automaticamente
    num_concentrators = calculate_optimal_concentrators(len(points))
    print(f"📊 Número ótimo de concentradores calculado: {num_concentrators}")
    
    # Selecionar concentradores com melhor distribuição geográfica
    print("🎯 Selecionando concentradores com distribuição geográfica otimizada...")
    concentrators = select_concentrators(points, num_concentrators)
    print(f"✅ {len(concentrators)} concentradores selecionados")
    
    # Exibir coordenadas dos concentradores
    print("\n📍 Concentradores selecionados:")
    for i, c in enumerate(concentrators):
        print(f"  {i+1:2d}. ID: {c['id']} - Lat: {c['latitude']:.5f}, Lon: {c['longitude']:.5f}")
    
    # Atribuir relés aos concentradores com balanceamento
    print("\n🔗 Atribuindo relés aos concentradores com balanceamento de carga...")
    result = assign_relays_to_concentrators(points, concentrators)
    
    # Estatísticas detalhadas
    total_relays = sum(len(c['relays']) for c in result['concentrators'])
    print(f"\n📊 Estatísticas finais:")
    print(f"  • Total de concentradores: {len(result['concentrators'])}")
    print(f"  • Total de relés atribuídos: {total_relays}")
    print(f"  • Pontos não utilizados: {len(points) - len(concentrators) - total_relays}")
    print(f"  • Média de LCUs por concentrador: {total_relays / len(concentrators):.1f}")
    
    # Distribuição detalhada por concentrador
    print(f"\n🏗️ Distribuição de relés por concentrador:")
    for i, c in enumerate(result['concentrators']):
        num_relays = len(c['relays'])
        status = "✅" if 450 <= num_relays <= 500 else "⚠️" if num_relays > 500 else "📊"
        print(f"  {status} Concentrador {i+1:2d} (ID: {c['id']:7d}): {num_relays:3d} relés")
    
    # Verificar distribuição
    within_range = sum(1 for c in result['concentrators'] if 450 <= len(c['relays']) <= 500)
    over_limit = sum(1 for c in result['concentrators'] if len(c['relays']) > 500)
    
    print(f"\n📈 Análise de distribuição:")
    print(f"  • Concentradores na faixa ideal (450-500): {within_range}/{len(concentrators)}")
    print(f"  • Concentradores acima do limite (>500): {over_limit}/{len(concentrators)}")
    
    # Salvar resultado
    output_path = 'assets/generated_data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Arquivo salvo em: {output_path}")
    print("🌟 Geração concluída com sucesso!")

if __name__ == "__main__":
    main()
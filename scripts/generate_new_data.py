import csv
import json
import math
import random
from typing import List, Dict, Tuple

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

def select_concentrators(points: List[Dict], num_concentrators: int = 12) -> List[Dict]:
    """Seleciona concentradores equidistantes usando algoritmo de k-means modificado"""
    
    # Calcular centro geográfico
    center_lat = sum(p['latitude'] for p in points) / len(points)
    center_lon = sum(p['longitude'] for p in points) / len(points)
    
    # Calcular raio aproximado da área
    max_distance = max(calculate_distance(center_lat, center_lon, p['latitude'], p['longitude']) for p in points)
    
    # Selecionar concentradores em um grid aproximadamente circular
    concentrators = []
    selected_ids = set()
    
    # Primeiro concentrador no centro
    center_point = min(points, key=lambda p: calculate_distance(center_lat, center_lon, p['latitude'], p['longitude']))
    if center_point['id'] not in selected_ids:
        concentrators.append(center_point)
        selected_ids.add(center_point['id'])
    
    # Selecionar os demais concentradores distribuídos radialmente
    remaining = num_concentrators - 1
    for i in range(remaining):
        angle = (2 * math.pi * i) / remaining
        radius = max_distance * 0.6  # 60% do raio máximo
        
        target_lat = center_lat + (radius / 111.0) * math.cos(angle)  # 1° ≈ 111km
        target_lon = center_lon + (radius / (111.0 * math.cos(math.radians(center_lat)))) * math.sin(angle)
        
        # Encontrar o ponto mais próximo da posição target que não foi selecionado
        candidates = [p for p in points if p['id'] not in selected_ids]
        if candidates:
            best_point = min(candidates, key=lambda p: calculate_distance(target_lat, target_lon, p['latitude'], p['longitude']))
            concentrators.append(best_point)
            selected_ids.add(best_point['id'])
    
    return concentrators

def assign_relays_to_concentrators(points: List[Dict], concentrators: List[Dict], max_relays_per_concentrator: int = 200) -> Dict:
    """Atribui relés aos concentradores baseado na proximidade geográfica"""
    
    concentrator_ids = {c['id'] for c in concentrators}
    available_points = [p for p in points if p['id'] not in concentrator_ids]
    
    result = {
        'concentrators': []
    }
    
    assigned_relay_ids = set()
    
    for concentrator in concentrators:
        # Calcular distâncias de todos os pontos disponíveis para este concentrador
        distances = []
        for point in available_points:
            if point['id'] not in assigned_relay_ids:
                dist = calculate_distance(
                    concentrator['latitude'], concentrator['longitude'],
                    point['latitude'], point['longitude']
                )
                distances.append((dist, point))
        
        # Ordenar por distância e pegar os mais próximos
        distances.sort(key=lambda x: x[0])
        
        # Atribuir até max_relays_per_concentrator relés mais próximos
        relays = []
        for dist, point in distances[:max_relays_per_concentrator]:
            if point['id'] not in assigned_relay_ids:
                relays.append({
                    'id': point['id'],
                    'latitude': point['latitude'],
                    'longitude': point['longitude'],
                    'type': point['type'],
                    'power': point['power'],
                    'area': point['area']
                })
                assigned_relay_ids.add(point['id'])
        
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
            'relays': relays
        }
        
        result['concentrators'].append(concentrator_data)
    
    return result

def main():
    print("🔄 Processando dados do CSV...")
    
    # Carregar pontos do CSV
    points = load_points_from_csv('assets/points.csv')
    print(f"✅ {len(points)} pontos carregados do CSV")
    
    if len(points) < 12:
        print("❌ Erro: Não há pontos suficientes para criar 12 concentradores")
        return
    
    # Selecionar 12 concentradores equidistantes
    print("🎯 Selecionando 12 concentradores equidistantes...")
    concentrators = select_concentrators(points, 12)
    print(f"✅ {len(concentrators)} concentradores selecionados")
    
    # Exibir coordenadas dos concentradores
    print("\n📍 Concentradores selecionados:")
    for i, c in enumerate(concentrators):
        print(f"  {i+1}. ID: {c['id']} - Lat: {c['latitude']:.5f}, Lon: {c['longitude']:.5f}")
    
    # Atribuir relés aos concentradores
    print("\n🔗 Atribuindo relés aos concentradores...")
    result = assign_relays_to_concentrators(points, concentrators, 200)
    
    # Estatísticas
    total_relays = sum(len(c['relays']) for c in result['concentrators'])
    print(f"\n📊 Estatísticas:")
    print(f"  • Total de concentradores: {len(result['concentrators'])}")
    print(f"  • Total de relés: {total_relays}")
    print(f"  • Pontos não atribuídos: {len(points) - len(concentrators) - total_relays}")
    
    # Distribuição de relés por concentrador
    print(f"\n🏗️ Distribuição de relés:")
    for i, c in enumerate(result['concentrators']):
        print(f"  • Concentrador {i+1} (ID: {c['id']}): {len(c['relays'])} relés")
    
    # Salvar resultado
    output_path = 'assets/generated_data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Arquivo salvo em: {output_path}")
    print("🌟 Geração concluída com sucesso!")

if __name__ == "__main__":
    main()
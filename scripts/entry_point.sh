#!/bin/bash
if [ ! -f ".env" ]; then
    echo "Dot env file not detected, creating it from .env.example"
    cp .env.example .env
else
    echo "Dot env file was detected, skipping creation"
fi

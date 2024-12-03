#!/bin/bash

function start_logging() {
    echo "Starting Elasticsearch and Kibana..."
    docker-compose -f docker-compose.logging.yml up -d
    
    echo "Waiting for Elasticsearch to start..."
    until curl -s http://localhost:9200 > /dev/null; do
        sleep 5
    done
    
    echo "Waiting for Kibana to start..."
    until curl -s http://localhost:5601 > /dev/null; do
        sleep 5
    done
    
    echo "Logging infrastructure is ready!"
    echo "Kibana UI: http://localhost:5601"
}

function stop_logging() {
    echo "Stopping logging infrastructure..."
    docker-compose -f docker-compose.logging.yml down
    echo "Logging infrastructure stopped"
}

case "$1" in
    "start")
        start_logging
        ;;
    "stop")
        stop_logging
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        exit 1
        ;;
esac

@echo off
setlocal

if "%1"=="" (
    echo Usage: %0 {start^|stop}
    exit /b 1
)

if "%1"=="start" (
    echo Starting Elasticsearch and Kibana...
    docker-compose -f docker-compose.logging.yml up -d
    
    echo Waiting for services to start...
    timeout /t 30 /nobreak
    
    echo Logging infrastructure is ready!
    echo Kibana UI: http://localhost:5601
    exit /b 0
)

if "%1"=="stop" (
    echo Stopping logging infrastructure...
    docker-compose -f docker-compose.logging.yml down
    echo Logging infrastructure stopped
    exit /b 0
)

echo Invalid argument: %1
echo Usage: %0 {start^|stop}
exit /b 1

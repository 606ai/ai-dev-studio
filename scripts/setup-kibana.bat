@echo off
setlocal

echo Waiting for Kibana to be ready...
:WAIT_KIBANA
curl -s http://localhost:5601 > nul
if errorlevel 1 (
    timeout /t 5 /nobreak > nul
    goto WAIT_KIBANA
)

echo Importing Kibana dashboards...
curl -X POST "http://localhost:5601/api/saved_objects/_import" ^
    -H "kbn-xsrf: true" ^
    --form file=@"../config/kibana/dashboards/main-dashboard.ndjson"

echo Setting up alert rules...
curl -X POST "http://localhost:5601/api/alerting/rules" ^
    -H "kbn-xsrf: true" ^
    -H "Content-Type: application/json" ^
    -d @"../config/kibana/alerts/alert-rules.json"

echo Kibana setup completed!

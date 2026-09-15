#!/bin/bash
# run-tests.sh - Dynamic testing orchestration engine inside the sandbox

# Fail early if an unhandled execution crash occurs
set -e

OUTPUT_FILE="/workspace/results.json"
echo '{"status": "failed", "score": 0, "logs": "Execution initialized..."}' > "$OUTPUT_FILE"

# Detect if the project language is Python or JavaScript/TypeScript
if [ -f "/workspace/app.py" ]; then
    echo "=== Running Python Suite Checker ==="
    
    # Run user script safely against hidden testing script vectors
    if python3 -m unittest /workspace/hidden_tests.py > /workspace/test.log 2>&1; then
        echo '{"status": "passed", "score": 100, "logs": "All unit tests passed successfully."}' > "$OUTPUT_FILE"
    else
        LOGS=$(cat /workspace/test.log | tr '\n' ' ' | tr '"' "'")
        echo "{\"status\": \"failed\", \"score\": 0, \"logs\": \"$LOGS\"}" > "$OUTPUT_FILE"
    fi

elif [ -f "/workspace/package.json" ]; then
    echo "=== Running Node.js Suite Checker ==="
    cd /workspace
    
    # Run isolated npm test execution blocks 
    if npm test > /workspace/test.log 2>&1; then
        echo '{"status": "passed", "score": 100, "logs": "All Node integration suites passed cleanly."}' > "$OUTPUT_FILE"
    else
        LOGS=$(cat /workspace/test.log | tr '\n' ' ' | tr '"' "'")
        echo "{\"status\": \"failed\", \"score\": 0, \"logs\": \"$LOGS\"}" > "$OUTPUT_FILE"
    fi
else
    echo '{"status": "failed", "score": 0, "logs": "Error: Missing baseline app entry points."}' > "$OUTPUT_FILE"
fi

#!/bin/bash
# Get User Access Token for Twenty CRM
# Required for operations that need user authentication (workflows, admin operations)
#
# Usage: source scripts/get-user-access-token.sh
#        Then use $ACCESS_TOKEN in subsequent requests
#
# Requires: _bmad/.env with TWENTY_ADMIN_EMAIL and TWENTY_ADMIN_PASSWORD

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load credentials from _bmad/.env
if [ -f "$PROJECT_ROOT/_bmad/.env" ]; then
  source "$PROJECT_ROOT/_bmad/.env"
else
  echo "Error: _bmad/.env not found. Please create it with TWENTY_ADMIN_EMAIL and TWENTY_ADMIN_PASSWORD"
  exit 1
fi

API_URL="${TWENTY_API_URL:-http://localhost:3000}/graphql"
ORIGIN="${TWENTY_ORIGIN:-http://phos-ind.localhost:3001}"

# Check required variables
if [ -z "$TWENTY_ADMIN_EMAIL" ] || [ -z "$TWENTY_ADMIN_PASSWORD" ]; then
  echo "Error: TWENTY_ADMIN_EMAIL and TWENTY_ADMIN_PASSWORD must be set in _bmad/.env"
  exit 1
fi

echo "Authenticating as $TWENTY_ADMIN_EMAIL..."

# Step 1: Get login token with password
cat > /tmp/twenty_login.py << 'PYEOF'
import json
import urllib.request
import sys
import os

email = os.environ.get('TWENTY_ADMIN_EMAIL')
password = os.environ.get('TWENTY_ADMIN_PASSWORD')
origin = os.environ.get('ORIGIN', 'http://phos-ind.localhost:3001')
api_url = os.environ.get('API_URL', 'http://localhost:3000/graphql')

# Step 1: Get login token
data = {
    "query": """mutation GetLoginTokenFromCredentials($email: String!, $password: String!, $origin: String!) {
        getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) {
            loginToken { token expiresAt }
        }
    }""",
    "variables": {
        "email": email,
        "password": password,
        "origin": origin
    }
}

req = urllib.request.Request(
    api_url,
    data=json.dumps(data).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error getting login token: {e}", file=sys.stderr)
    sys.exit(1)

if 'errors' in result:
    print(f"GraphQL error: {result['errors']}", file=sys.stderr)
    sys.exit(1)

login_token = result['data']['getLoginTokenFromCredentials']['loginToken']['token']

# Step 2: Exchange login token for access token
data = {
    "query": """mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
        getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
            tokens {
                accessOrWorkspaceAgnosticToken { token expiresAt }
                refreshToken { token expiresAt }
            }
        }
    }""",
    "variables": {
        "loginToken": login_token,
        "origin": origin
    }
}

req = urllib.request.Request(
    api_url,
    data=json.dumps(data).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error getting access token: {e}", file=sys.stderr)
    sys.exit(1)

if 'errors' in result:
    print(f"GraphQL error: {result['errors']}", file=sys.stderr)
    sys.exit(1)

tokens = result['data']['getAuthTokensFromLoginToken']['tokens']
access_token = tokens['accessOrWorkspaceAgnosticToken']['token']
access_expires = tokens['accessOrWorkspaceAgnosticToken']['expiresAt']
refresh_token = tokens['refreshToken']['token']
refresh_expires = tokens['refreshToken']['expiresAt']

# Output tokens for shell eval
print(f"export ACCESS_TOKEN='{access_token}'")
print(f"export ACCESS_TOKEN_EXPIRES='{access_expires}'")
print(f"export REFRESH_TOKEN='{refresh_token}'")
print(f"export REFRESH_TOKEN_EXPIRES='{refresh_expires}'")
PYEOF

# Run Python script and eval the exports
RESULT=$(TWENTY_ADMIN_EMAIL="$TWENTY_ADMIN_EMAIL" \
         TWENTY_ADMIN_PASSWORD="$TWENTY_ADMIN_PASSWORD" \
         ORIGIN="$ORIGIN" \
         API_URL="$API_URL" \
         PROJECT_ROOT="$PROJECT_ROOT" \
         python3 /tmp/twenty_login.py)

if [ $? -eq 0 ]; then
  eval "$RESULT"

  # Save to persistent file with workspace context
  cat > "$PROJECT_ROOT/_bmad/.env.tokens" << EOF
# Phos Industries Workspace - ALWAYS USE THIS WORKSPACE ID
export PHOS_WORKSPACE_ID='572a2b40-3011-4a15-bff4-376f817b88e7'
export ACCESS_TOKEN='$ACCESS_TOKEN'
export ACCESS_TOKEN_EXPIRES='$ACCESS_TOKEN_EXPIRES'
export REFRESH_TOKEN='$REFRESH_TOKEN'
export REFRESH_TOKEN_EXPIRES='$REFRESH_TOKEN_EXPIRES'
EOF

  echo "Authentication successful!"
  echo "ACCESS_TOKEN expires: $ACCESS_TOKEN_EXPIRES"
  echo ""
  echo "Tokens saved to _bmad/.env.tokens"
  echo "Source with: source _bmad/.env.tokens"
else
  echo "Authentication failed"
  exit 1
fi

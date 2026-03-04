import requests
import json

class MCPClient:
    def __init__(self, port=8001):
        self.base_url = f"http://localhost:{port}"

    def call_tool(self, tool_name, arguments):
        """
        Call a tool on the Smart Contract Tool Server via HTTP.
        """
        url = f"{self.base_url}/call"
        payload = {
            "name": tool_name,
            "arguments": arguments
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                # Server returns {"result": [{"type": "text", "text": "..."}]}
                result = data.get("result", [])
                if result and len(result) > 0:
                    return result[0].get("text", str(data))
                return str(data)
            else:
                return f"Error: Tool Server returned {response.status_code}: {response.text}"
        except Exception as e:
            return f"Error connecting to Tool Server: {str(e)}"

# Singleton instance
mcp_client = MCPClient()

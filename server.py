import http.server
import socketserver

#debug
import pdb

# Define the port number on which you want to run the server
port = 8000

# Create a simple HTTP server
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", port), Handler)

# Print a message indicating that the server has started
print(f"Server running on port {port}")

# Start the server
httpd.serve_forever()

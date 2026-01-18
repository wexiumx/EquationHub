# Main Sinatra server for tracking user events
require 'sinatra'
require_relative 'routes'

# Server configuration
set :bind, '0.0.0.0'
set :port, 4567
set :environment, :production

# Enable CORS for frontend requests
before do
  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

# Handle OPTIONS requests for CORS
options '*' do
  status 200
end

# Enable error handling
error do |err|
  status 500
  { error: "Server error: #{err.message}" }.to_json
end
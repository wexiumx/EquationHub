# API endpoints for tracking events
require 'json'
require_relative 'logger'

# Health check endpoint
get '/health' do
  content_type :json
  { status: 'ok', time: Time.now.utc.iso8601 }.to_json
end

# Track user events
get '/track' do
  content_type :json
  
  # Extract and validate parameters
  page = params['page']
  event = params['event']
  lang = params['lang']
  
  # Validate required parameter
  if event.nil? || event.empty?
    status 400
    return { error: 'event parameter required' }.to_json
  end
  
  # Log the event
  success = log_event(page: page, event: event, lang: lang)
  
  # Return response
  if success
    { status: 'logged', page: page, event: event, lang: lang }.to_json
  else
    status 500
    { error: 'failed to log event' }.to_json
  end
end

# Logs user events with timestamps
require_relative 'data'
require 'time'

# Log event to stats file
def log_event(page: nil, event: nil, lang: nil)
  # Build entry with timestamp
  entry = {
    timestamp: Time.now.utc.iso8601,
    page: page&.to_s,
    event: event&.to_s,
    language: lang&.to_s
  }.compact
  
  # Only save if we have at least the event
  if entry[:event].nil?
    puts "Warning: No event specified"
    return false
  end
  
  save_entry(entry)
end

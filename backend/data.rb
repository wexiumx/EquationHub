# Handles saving event data to JSON file
require 'json'
require 'fileutils'

# Save entry to stats.json with error handling
def save_entry(entry)
  return false if entry.nil? || entry.empty?
  
  begin
    File.open('stats.json', 'a') do |file|
      file.puts(entry.to_json)
    end
    true
  rescue IOError => e
    puts "Error saving entry: #{e.message}"
    false
  end
end

import requests
import time

API_URL = "http://localhost:8000/api/update-location"

# The bus moves progressively closer to the destination (10.3444, 76.2081)
route_coordinates = [
    (10.3400, 76.2081), # ~480 meters away
    (10.3420, 76.2081), # ~266 meters away
    (10.3435, 76.2081), # ~100 meters away (Will trigger alert here!)
    (10.3444, 76.2081), # 0 meters away (Arrived)
]

def simulate_bus():
    print("🚌 Starting bus simulation...")
    while True:
        for lat, lng in route_coordinates:
            payload = {
                "bus_id": "MY-BUS-01",
                "latitude": lat,
                "longitude": lng,
                "route": "My Personal Route"
            }
            try:
                requests.post(API_URL, json=payload)
                print(f"📍 Sent location: {lat}, {lng}")
            except requests.exceptions.ConnectionError:
                print("⚠️ Backend offline. Waiting...")
            
            time.sleep(4) # Wait 4 seconds before moving to next point

if __name__ == "__main__":
    simulate_bus()
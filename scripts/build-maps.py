"""Build local SVG map geometry from Natural Earth and GeoNames source data."""
import json, math, zipfile, tempfile, urllib.request
from pathlib import Path

countries_file = Path(tempfile.gettempdir()) / 'neon-countries-50m.geojson'
cities_file = Path(tempfile.gettempdir()) / 'neon-cities.zip'
for destination, url in [
 (countries_file, 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'),
 (cities_file, 'https://download.geonames.org/export/dump/cities15000.zip'),
]:
 if not destination.exists(): urllib.request.urlretrieve(url, destination)
FEATURES = json.loads(countries_file.read_text())['features']
CITY_ROWS = [line.split('\t') for line in zipfile.ZipFile(cities_file).read('cities15000.txt').decode().splitlines()]
WANTED = {
 'Seoul': ('Seoul','KR','KOR'), 'Florence': ('Florence','IT','ITA'),
 'Bremen': ('Bremen','DE','DEU'), 'London': ('London','GB','GBR'),
 'Berlin': ('Berlin','DE','DEU'), 'Amsterdam': ('Amsterdam','NL','NLD'),
 'Tilburg': ('Tilburg','NL','NLD'), 'NewYork': ('New York City','US','USA'),
 'Paris': ('Paris','FR','FRA'), 'Heidelberg': ('Heidelberg','DE','DEU'),
 'Brussels': ('Brussels','BE','BEL'), 'Stuttgart': ('Stuttgart','DE','DEU'),
 'Sydney': ('Sydney','AU','AUS'),
}
def mercator(point):
 lon,lat=point
 return [math.radians(lon), -math.log(math.tan(math.pi/4+math.radians(lat)/2))]
result={'countries':{},'cities':{}}
for code in sorted({v[2] for v in WANTED.values()}):
 feature=next(f for f in FEATURES if f['properties']['ADM0_A3']==code)
 geometry=feature['geometry']
 polygons=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
 rings=[polygon[0] for polygon in polygons]
 if code=='USA': rings=[r for r in rings if all(-126<=p[0]<=-66 and 24<=p[1]<=50 for p in r)]
 if code=='FRA': rings=[r for r in rings if all(-6<=p[0]<=10 and 40<=p[1]<=52 for p in r)]
 if code=='NLD': rings=[r for r in rings if all(3<=p[0]<=8 and 50<=p[1]<=55 for p in r)]
 if code=='AUS': rings=[r for r in rings if all(110<=p[0]<=155 and -45<=p[1]<=-10 for p in r)]
 points=[mercator(point) for ring in rings for point in ring]
 min_x=min(p[0] for p in points);max_x=max(p[0] for p in points)
 min_y=min(p[1] for p in points);max_y=max(p[1] for p in points)
 scale=min(480/(max_x-min_x),480/(max_y-min_y))
 def project(point):
  x,y=mercator(point)
  return [round(300+(x-(min_x+max_x)/2)*scale,2),round(300+(y-(min_y+max_y)/2)*scale,2)]
 paths=[]
 for ring in rings:
  p=[project(point) for point in ring]
  paths.append('M'+'L'.join(f'{x},{y}' for x,y in p)+'Z')
 result['countries'][code]={'name':feature['properties']['ADMIN'],'paths':paths}
 for label,(name,country,country_code) in WANTED.items():
  if country_code!=code:continue
  candidates=[r for r in CITY_ROWS if r[8]==country and (r[1]==name or r[2]==name) and r[6]=='P']
  city=max(candidates,key=lambda r:int(r[14] or 0))
  lat,lon=float(city[4]),float(city[5]);x,y=project([lon,lat])
  assert 20<x<580 and 20<y<580,(label,x,y)
  result['cities'][label]={'country':code,'x':x,'y':y,'latitude':lat,'longitude':lon}
Path('src/data/maps.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps(result['cities'],indent=2))

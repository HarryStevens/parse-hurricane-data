var fs = require("fs");

var table = read_table("data/hurdat2-1851-2017-050118.txt", ",");

var curr_obj,
    curr_entry_count;

var data = [],
    geojson = {
      "type": "FeatureCollection",
      "features": []
    };

// See: https://www.nhc.noaa.gov/data/hurdat/hurdat2-format-atlantic.pdf
table.forEach(line => {
  // Parse the header line
  if (line.length === 3){
    curr_entry_count = 0;
    curr_obj = {data: []};

    curr_obj.basin = line.cells[0].slice(0, 2);
    curr_obj.number = line.cells[0].slice(2, 4);
    curr_obj.year = +line.cells[0].slice(4, 8);
    curr_obj.name = line.cells[1];
    curr_obj.entries = line.cells[2];
  }

  // Parse the data line
  else {
    curr_entry_count++;

    var o = {
      year: line.cells[0].slice(0, 4),
      month: line.cells[0].slice(4, 6),
      day: line.cells[0].slice(6, 8),
      hour: line.cells[1].slice(0, 2),
      minute: line.cells[1].slice(2, 4),
      record_identifier: line.cells[2],
      status_of_system: line.cells[3],
      latitude: parse_coord(line.cells[4]),
      longitude: parse_coord(line.cells[5]),
      maximum_sustained_wind: +line.cells[6],
      minimum_pressure: line.cells[7]
    };

    curr_obj.data.push(o);
    if (curr_entry_count == curr_obj.entries) {
      data.push(curr_obj); 
    }
  }

});

data.forEach(d0 => {
  d0.statuses_of_system = uniqueBy(d0.data, "status_of_system");
  d0.maximum_sustained_wind = max(d0.data.map(m => m.maximum_sustained_wind));

  var keys_0 = Object.keys(d0);
  keys_0.shift();
  var keys_1 = Object.keys(d0.data[0]);

  d0.data.forEach((d1, i1) => {

    if (i1 < d0.data.length - 1){
      var geojson_obj = { 
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": []},
        "properties": {}
      }

      keys_0.forEach(k => {
        geojson_obj.properties[k] = d0[k];
      });
      keys_1.forEach(k => {
        geojson_obj.properties[k] = d1[k];
      });

      geojson_obj.geometry.coordinates = [[d1.longitude, d1.latitude], [d0.data[i1 + 1].longitude, d0.data[i1 + 1].latitude]];

      geojson.features.push(geojson_obj);
    }
  });

  return d0;  
});

fs.writeFileSync("output/historical-hurricanes.json", JSON.stringify(data));
fs.writeFileSync("output/historical-hurricanes.geo.json", JSON.stringify(geojson));

function parse_coord(n){
  var s = n.split("");
  var cardinal = s.pop();
  var number = +s.join("");
  
  return ["W", "S"].includes(cardinal) ? 0 - number : number;
}

function read_table(file_name, delimiter) {
  var file_txt = fs.readFileSync(file_name, "utf8");
  var lines = file_txt.split("\n").map(d => {
    var c = d.split(delimiter).map(t => t.trim());
    c.pop();
    return {
      cells: c,
      length: c.length  
    }
  });
  lines.pop();
  return lines;
}

function max(arr){
  return arr.reduce((a, b) => Math.max(a, b));
}
function pluck(arr, attribute){
  return arr.map(d => d[attribute]);
}
function unique(arr){
  return arr.filter((value, index, self) => self.indexOf(value) === index);
}
function uniqueBy(arr, attribute){
  return unique(pluck(arr, attribute));
}

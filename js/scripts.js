// Set up size
var mapWidth = 750;
var mapHeight = 750;

// Set up projection that the map is using
var projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map
// projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]

// Add an SVG element to the DOM
var svg = d3.select('body').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

d3.csv("/data/restaurant_scores.csv").then(function(data) {
	console.log(data);
  svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", d => {
    var projectedLocation = projection([d.business_longitude, d.business_latitude]);
    return projectedLocation[0];
  })
  .attr("cy", d => {
    var projectedLocation = projection([d.business_longitude, d.business_latitude]);
    return projectedLocation[1];
  })
  .attr('r', 1)
  .style("fill", "blue");
});
/*
var projectedLocation = projection([business_longitude, business_latitude]);
var circle = svg.append('circle')
    .attr('cx', projectedLocation[0])
    .attr('cy', projectedLocaiton[1])
    .attr('r', 1);



const circles =
svg.selectAll("circle")
.data(circle_position_data)
.enter()
.append("circle")
.attr("cx", d => d.x)
.attr("cy", d => d.y)
.attr("r", 55)
.style("fill", "blue");
var projectedLocation = projection([business_longitude, business_latitude]);
var circle = svg.append('circle')
    .attr('cx', projectedLocation[0])
    .attr('cy', projectedLocaiton[1])
    .attr('r', 1);*/

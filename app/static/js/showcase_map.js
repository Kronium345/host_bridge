// Showcase Choropleth Map for UK STR Regulations
anychart.onDocumentReady(function () {
    // Create a map instance
    let map = anychart.map();

    // Set the geodata for UK
    map.geoData(anychart.maps.united_kingdom);

    // Load data from JSON file
    anychart.data.loadJsonFile(
        '/static/data/uk_str_regulations.json',
        function (data) {
            // Create a choropleth series with the data directly
            let series = map.choropleth(data);

            // Configure the color scale based on regulation levels
            series.colorScale(
                anychart.scales.linearColor("#d4e9d7", "#90d4a0", "#2E8B57", "#1a5c3a")
            );

            // Set stroke (border) for regions
            series.stroke("#ffffff", 1);
            series.hovered().stroke("#ffffff", 2);

            // Customize colors in hovered state
            series.hovered().fill(function (d) {
                return anychart.color.darken(d.sourceColor, 0.2);
            });

            // Disable the default color range legend (we have our own)
            map.colorRange().enabled(false);

            // Customize tooltip
            series
                .tooltip()
                .useHtml(true)
                .format(function (d) {
                    if (d.getData('name')) {
                        return (
                            "<div style='font-size:12px; padding:5px;'>" +
                            "<b>" + d.getData('name') + "</b><br/>" +
                            "<span style='color:#666;'>" + d.getData('description') + "</span>" +
                            "</div>"
                        );
                    } else {
                        return null;
                    }
                });

            // Disable credits
            map.credits().enabled(false);

            // Set smaller padding
            map.padding(5);

            // Set zoom level for showcase
            map.zoom(2.5);

            // Set the container
            map.container('showcase-choropleth-container');

            // Draw the map
            map.draw();
        }
    );
});

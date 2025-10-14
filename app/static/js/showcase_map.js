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

            // Use ordinal color scale based on regulation levels
            var colorScale = anychart.scales.ordinalColor();
            colorScale.ranges([
                { less: 4.5, color: "#2E8B57" },
                { from: 2.5, to: 4.5, color: "#f59e0b" },
                { greater: 0, less: 2.5, color: "#ef4444" }
            ]);
            series.colorScale(colorScale);

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
                            "<div style='font-size:12px; padding:10px; background:white; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12);'>" +
                            "<b style='color:#1a1a1a;'>" + d.getData('name') + "</b><br/>" +
                            "<span style='color:#333333;'>" + d.getData('description') + "</span>" +
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

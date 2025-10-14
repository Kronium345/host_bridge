// Legality Map - AnyChart Choropleth Map for UK STR Regulations
anychart.onDocumentReady(function () {
    // Create a map instance
    let map = anychart.map();

    // Set the geodata for UK
    map.geoData(anychart.maps.united_kingdom);

    // Load data from JSON file
    anychart.data.loadJsonFile(
        '/static/data/uk_str_regulations.json',
        function (data) {
            // Create choropleth series with loaded data
            let series = map.choropleth(data);

            // Use ordinal color scale based on regulation_level field
            var colorScale = anychart.scales.ordinalColor();
            colorScale.ranges([
                // Green for permitted (matching legend)
                { less: 4.5, color: "#2E8B57", name: "STR Permitted" },
                // Orange for restricted (matching legend)
                { from: 2.5, to: 4.5, color: "#f59e0b", name: "Restricted / Permit Needed" },
                // Red/Pink for not permitted / varies (matching legend)
                { greater: 0, less: 2.5, color: "#ef4444", name: "Varies by Area" }
            ]);
            series.colorScale(colorScale);

            // Customize the colors in the hovered state
            series.hovered().fill(function (d) {
                return anychart.color.darken(d.sourceColor, 0.2);
            });

            // Set stroke (borders)
            series.stroke("#ffffff", 1);
            series.hovered().stroke("#ffffff", 2);

            // Create the map legend
            map.colorRange().enabled(true);
            map.colorRange().orientation('right');
            map.colorRange().title().enabled(true);
            map.colorRange().title().text('Regulation Level');

            // Create zoom controls
            let zoomController = anychart.ui.zoom();
            zoomController.render(map);

            // Customize the tooltip text
            series
                .tooltip()
                .useHtml(true)
                .format(function (d) {
                    let name = d.getData('name') || 'Unknown';
                    let description = d.getData('description') || 'No information available';
                    let regulationLevel = d.getData('regulation_level') || 'unknown';
                    let value = d.getData('value') || 0;

                    // Determine status badge color
                    let badgeColor = '#6b7280';
                    let statusText = 'Unknown';

                    if (regulationLevel === 'permitted') {
                        badgeColor = '#2E8B57';
                        statusText = 'Permitted';
                    } else if (regulationLevel === 'restricted') {
                        badgeColor = '#f59e0b';
                        statusText = 'Restricted';
                    } else if (regulationLevel === 'not-permitted') {
                        badgeColor = '#ef4444';
                        statusText = 'Not Permitted';
                    }

                    return (
                        "<div style='font-size:13px; padding:14px; max-width:300px; background:white; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);'>" +
                        "<div style='display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;'>" +
                        "<h4 style='margin:0; color:#1a1a1a; font-size:16px; font-weight:700;'>" + name + "</h4>" +
                        "<span style='background:" + badgeColor + "; color:white; padding:5px 12px; border-radius:14px; font-size:11px; font-weight:700;'>" + statusText + "</span>" +
                        "</div>" +
                        "<p style='margin:8px 0; color:#333333; line-height:1.6; font-size:13px;'>" + description + "</p>" +
                        "<div style='margin-top:12px; padding-top:10px; border-top:2px solid #e5e7eb;'>" +
                        "<span style='color:#555555; font-size:12px; font-weight:600;'>Regulation Score: <strong style='color:#2E8B57;'>" + value + "/5</strong></span>" +
                        "</div>" +
                        "</div>"
                    );
                });

            // Set the map title
            map
                .title()
                .enabled(true)
                .useHtml(true)
                .text(
                    '<span style="color: #004c46; font-size:20px; font-weight:700;">UK Short-Term Rental Regulations Map</span>' +
                    '<br/><span style="font-size: 13px; color:#6b7280;">Major cities colored by STR regulation level - Hover for details</span>'
                );

            // Disable credits
            map.credits().enabled(false);

            // Set zoom level (more zoomed in on UK)
            map.zoom(2.8);
            map.minZoomLevel(1.5);

            // Set the container
            map.container("str-map");

            // Initiate the map drawing
            map.draw();

            // Handle postcode search
            const searchBtn = document.getElementById('search-btn');
            const postcodeInput = document.getElementById('postcode-search');

            if (searchBtn && postcodeInput) {
                searchBtn.addEventListener('click', function () {
                    const postcode = postcodeInput.value.trim();
                    if (postcode) {
                        alert('Postcode search functionality: Looking up regulations for ' + postcode + '\n\nThis feature will be enhanced with actual postcode-to-region mapping.');
                    } else {
                        alert('Please enter a postcode');
                    }
                }, { passive: true });

                postcodeInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        searchBtn.click();
                    }
                }, { passive: true });
            }
        }
    );
});

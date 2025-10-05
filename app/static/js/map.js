document.addEventListener('DOMContentLoaded', function () {
    // Initialize map centered on UK
    const map = L.map('str-map').setView([54.5, -2.5], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // STR zone mapping - customize this based on your GeoJSON properties
    const strZoneMapping = {
        // Scotland - generally permitted
        'City of Edinburgh': 'permitted',
        'Glasgow City': 'permitted',
        'Aberdeen City': 'permitted',
        'Dundee City': 'permitted',
        'Highland': 'permitted',
        'Fife': 'permitted',
        'Perth and Kinross': 'permitted',
        'Stirling': 'permitted',
        'Falkirk': 'permitted',
        'West Lothian': 'permitted',
        'East Lothian': 'permitted',
        'Midlothian': 'permitted',
        'Scottish Borders': 'permitted',
        'Dumfries and Galloway': 'permitted',
        'South Ayrshire': 'permitted',
        'East Ayrshire': 'permitted',
        'North Ayrshire': 'permitted',
        'Renfrewshire': 'permitted',
        'East Renfrewshire': 'permitted',
        'Inverclyde': 'permitted',
        'West Dunbartonshire': 'permitted',
        'Argyll and Bute': 'permitted',
        'Angus': 'permitted',
        'Clackmannanshire': 'permitted',
        'East Dunbartonshire': 'permitted',
        'Moray': 'permitted',
        'Na h-Eileanan Siar': 'permitted',
        'Orkney Islands': 'permitted',
        'Shetland Islands': 'permitted',
        'South Lanarkshire': 'permitted',
        'North Lanarkshire': 'permitted',
        'Aberdeenshire': 'permitted',

        // Wales - generally restricted
        'Cardiff': 'restricted',
        'Swansea': 'restricted',
        'Newport': 'restricted',
        'Wrexham': 'restricted',
        'Flintshire': 'restricted',
        'Denbighshire': 'restricted',
        'Conwy': 'restricted',
        'Gwynedd': 'restricted',
        'Isle of Anglesey': 'restricted',
        'Ceredigion': 'restricted',
        'Pembrokeshire': 'restricted',
        'Carmarthenshire': 'restricted',
        'Neath Port Talbot': 'restricted',
        'Bridgend': 'restricted',
        'Vale of Glamorgan': 'restricted',
        'Rhondda Cynon Taf': 'restricted',
        'Caerphilly': 'restricted',
        'Blaenau Gwent': 'restricted',
        'Torfaen': 'restricted',
        'Monmouthshire': 'restricted',
        'Powys': 'restricted',
        'Merthyr Tydfil': 'restricted',

        // England - mixed
        'Manchester': 'not-permitted',
        'Birmingham': 'restricted',
        'Liverpool': 'restricted',
        'Leeds': 'restricted',
        'Sheffield': 'not-permitted',
        'Bristol, City of': 'restricted',
        'Newcastle upon Tyne': 'permitted',
        'Nottingham': 'restricted',
        'Leicester': 'restricted',
        'Coventry': 'restricted',
        'Bradford': 'restricted',
        'Belfast': 'permitted',

        // London Boroughs - generally restricted
        'City of London': 'restricted',
        'Westminster': 'restricted',
        'Camden': 'restricted',
        'Islington': 'restricted',
        'Hackney': 'restricted',
        'Tower Hamlets': 'restricted',
        'Greenwich': 'restricted',
        'Lewisham': 'restricted',
        'Southwark': 'restricted',
        'Lambeth': 'restricted',
        'Wandsworth': 'restricted',
        'Hammersmith and Fulham': 'restricted',
        'Kensington and Chelsea': 'restricted',
        'Brent': 'restricted',
        'Ealing': 'restricted',
        'Hounslow': 'restricted',
        'Richmond upon Thames': 'restricted',
        'Kingston upon Thames': 'restricted',
        'Merton': 'restricted',
        'Sutton': 'restricted',
        'Croydon': 'restricted',
        'Bromley': 'restricted',
        'Bexley': 'restricted',
        'Newham': 'restricted',
        'Waltham Forest': 'restricted',
        'Redbridge': 'restricted',
        'Havering': 'restricted',
        'Barking and Dagenham': 'restricted',
        'Enfield': 'restricted',
        'Barnet': 'restricted',
        'Haringey': 'restricted',
        'Harrow': 'restricted',
        'Hillingdon': 'restricted',

        // Additional areas that might be in your new GeoJSON
        'Hartlepool': 'restricted',
        'Middlesbrough': 'restricted',
        'Redcar and Cleveland': 'restricted',
        'Stockton-on-Tees': 'restricted',
        'Darlington': 'restricted',
        'Halton': 'restricted',
        'Warrington': 'restricted',
        'Blackburn with Darwen': 'restricted',
        'Blackpool': 'restricted',
        'Kingston upon Hull, City of': 'restricted',
        'East Riding of Yorkshire': 'restricted',
        'North East Lincolnshire': 'restricted',
        'North Lincolnshire': 'restricted',
        'York': 'restricted',
        'Derby': 'restricted',
        'Rutland': 'restricted',
        'Herefordshire, County of': 'restricted',
        'Telford and Wrekin': 'restricted',
        'Stoke-on-Trent': 'restricted',
        'Bath and North East Somerset': 'restricted',
        'North Somerset': 'restricted',
        'South Gloucestershire': 'restricted',
        'Plymouth': 'restricted',
        'Torbay': 'restricted',
        'Swindon': 'restricted',
        'Peterborough': 'restricted',
        'Luton': 'restricted',
        'Southend-on-Sea': 'restricted',
        'Thurrock': 'restricted',
        'Medway': 'restricted',
        'Bracknell Forest': 'restricted',
        'West Berkshire': 'restricted',
        'Reading': 'restricted',
        'Slough': 'restricted',
        'Windsor and Maidenhead': 'restricted',
        'Wokingham': 'restricted',
        'Milton Keynes': 'restricted',
        'Brighton and Hove': 'restricted',
        'Portsmouth': 'restricted',
        'Southampton': 'restricted',
        'Isle of Wight': 'restricted',
        'County Durham': 'restricted',
        'Cheshire East': 'restricted',
        'Cheshire West and Chester': 'restricted',
        'Shropshire': 'restricted',
        'Cornwall': 'restricted',
        'Isles of Scilly': 'restricted',
        'Wiltshire': 'restricted',
        'Bedford': 'restricted',
        'Central Bedfordshire': 'restricted',
        'Northumberland': 'restricted',
        'Bournemouth, Christchurch and Poole': 'restricted',
        'Dorset': 'restricted',
        'Buckinghamshire': 'restricted',
        'North Northamptonshire': 'restricted',
        'West Northamptonshire': 'restricted',
        'Cumberland': 'restricted',
        'Westmorland and Furness': 'restricted',
        'North Yorkshire': 'restricted',
        'Somerset': 'restricted',
        'Bolton': 'restricted',
        'Bury': 'restricted',
        'Oldham': 'restricted',
        'Rochdale': 'restricted',
        'Salford': 'restricted',
        'Stockport': 'restricted',
        'Tameside': 'restricted',
        'Trafford': 'restricted',
        'Wigan': 'restricted',
        'Knowsley': 'restricted',
        'St. Helens': 'restricted',
        'Sefton': 'restricted',
        'Wirral': 'restricted',
        'Barnsley': 'restricted',
        'Doncaster': 'restricted',
        'Rotherham': 'restricted',
        'North Tyneside': 'restricted',
        'South Tyneside': 'restricted',
        'Sunderland': 'restricted',
        'Dudley': 'restricted',
        'Sandwell': 'restricted',
        'Solihull': 'restricted',
        'Walsall': 'restricted',
        'Wolverhampton': 'restricted',
        'Calderdale': 'restricted',
        'Kirklees': 'restricted',
        'Wakefield': 'restricted',
        'Gateshead': 'restricted',
        'Barking and Dagenham': 'restricted',
        'Barnet': 'restricted',
        'Bexley': 'restricted',
        'Brent': 'restricted',
        'Bromley': 'restricted',
        'Camden': 'restricted',
        'Croydon': 'restricted',
        'Ealing': 'restricted',
        'Enfield': 'restricted',
        'Greenwich': 'restricted',
        'Hackney': 'restricted',
        'Hammersmith and Fulham': 'restricted',
        'Haringey': 'restricted',
        'Harrow': 'restricted',
        'Havering': 'restricted',
        'Hillingdon': 'restricted',
        'Hounslow': 'restricted',
        'Islington': 'restricted',
        'Kensington and Chelsea': 'restricted',
        'Kingston upon Thames': 'restricted',
        'Lambeth': 'restricted',
        'Lewisham': 'restricted',
        'Merton': 'restricted',
        'Newham': 'restricted',
        'Redbridge': 'restricted',
        'Richmond upon Thames': 'restricted',
        'Southwark': 'restricted',
        'Sutton': 'restricted',
        'Tower Hamlets': 'restricted',
        'Waltham Forest': 'restricted',
        'Wandsworth': 'restricted',
        'Westminster': 'restricted',
        'Cambridgeshire': 'restricted',
        'Derbyshire': 'restricted',
        'Devon': 'restricted',
        'East Sussex': 'restricted',
        'Essex': 'restricted',
        'Gloucestershire': 'restricted',
        'Hampshire': 'restricted',
        'Hertfordshire': 'restricted',
        'Kent': 'restricted',
        'Lancashire': 'restricted',
        'Leicestershire': 'restricted',
        'Lincolnshire': 'restricted',
        'Norfolk': 'restricted',
        'Nottinghamshire': 'restricted',
        'Oxfordshire': 'restricted',
        'Staffordshire': 'restricted',
        'Suffolk': 'restricted',
        'Surrey': 'restricted',
        'Warwickshire': 'restricted',
        'West Sussex': 'restricted',
        'Worcestershire': 'restricted',
        'Antrim and Newtownabbey': 'permitted',
        'Armagh City, Banbridge and Craigavon': 'permitted',
        'Causeway Coast and Glens': 'permitted',
        'Derry City and Strabane': 'permitted',
        'Fermanagh and Omagh': 'permitted',
        'Lisburn and Castlereagh': 'permitted',
        'Mid and East Antrim': 'permitted',
        'Mid Ulster': 'permitted',
        'Newry, Mourne and Down': 'permitted',
        'Ards and North Down': 'permitted'
    };

    // Color mapping
    const zoneColors = {
        'permitted': '#2E8B57',
        'restricted': '#f59e0b',
        'not-permitted': '#ef4444'
    };

    // Helper: normalize names to improve matches with mapping
    function normalizeName(raw) {
        if (!raw) return '';
        return String(raw)
            .toLowerCase()
            .replace(/\s*\([^)]*\)\s*/g, ' ') // remove parentheticals
            .replace(/[,']/g, ' ')              // remove commas/apostrophes
            .replace(/\b(city|county|district|borough|metropolitan|royal|london|upon|and|of|the|council|isles|isle)\b/g, '')
            .replace(/\s+/g, ' ')              // collapse spaces
            .trim();
    }

    // Build normalized lookup from provided mapping
    const normalizedZoneMapping = (() => {
        const out = {};
        Object.keys(strZoneMapping).forEach(key => {
            out[normalizeName(key)] = strZoneMapping[key];
        });
        return out;
    })();

    // Load and display GeoJSON
    fetch('/static/data/uk-countries.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('GeoJSON loaded successfully:', data);
            console.log('Number of features:', data.features.length);
            console.log('First feature:', data.features[0]);

            // Check if features have geometry
            const featuresWithGeometry = data.features.filter(f => f.geometry && f.geometry.coordinates);
            console.log('Features with geometry:', featuresWithGeometry.length);

            if (featuresWithGeometry.length === 0) {
                console.error('No features with valid geometry found!');
                return;
            }

            const validFeatures = data.features.filter(feature =>
                feature.geometry &&
                feature.geometry.coordinates &&
                feature.geometry.coordinates.length > 0
            );

            console.log(`Valid features with geometry: ${validFeatures.length} out of ${data.features.length}`);

            if (validFeatures.length === 0) {
                console.error('No valid features found! All features have null geometry.');
                return;
            }

            // Create new GeoJSON with only valid features
            const validGeoJSON = {
                type: "FeatureCollection",
                features: validFeatures
            };

            const geoJsonLayer = L.geoJSON(validGeoJSON, {
                style: function (feature) {
                    const rawName = feature.properties.LAD25NM || feature.properties.CTYUA24NM || feature.properties.NAME || feature.properties.name || feature.properties.County;
                    const norm = normalizeName(rawName);
                    const zoneType = normalizedZoneMapping[norm] || 'restricted';
                    if (!normalizedZoneMapping[norm]) {
                        console.debug(`Unmapped area -> defaulting to restricted: ${rawName} (normalized: ${norm})`);
                    } else {
                        console.log(`Area: ${rawName}, Zone: ${zoneType}, Color: ${zoneColors[zoneType]}`);
                    }
                    return {
                        color: zoneColors[zoneType],
                        fillColor: zoneColors[zoneType],
                        fillOpacity: 0.8,
                        weight: 3,
                        opacity: 1
                    };
                },
                onEachFeature: function (feature, layer) {
                    const rawName = feature.properties.LAD25NM || feature.properties.CTYUA24NM || feature.properties.NAME || feature.properties.name || feature.properties.County;
                    const norm = normalizeName(rawName);
                    const zoneType = normalizedZoneMapping[norm] || 'restricted';

                    // Add tooltip
                    layer.bindTooltip(rawName, {
                        permanent: false,
                        direction: 'center',
                        className: 'custom-tooltip'
                    });

                    // Add click popup
                    layer.on('click', function () {
                        showAreaPopup({
                            name: areaName,
                            type: zoneType,
                            description: getDescription(zoneType),
                            rate: getRate(areaName),
                            council: getCouncil(areaName)
                        });
                    });
                }
            });

            // Add the layer to the map and log confirmation
            geoJsonLayer.addTo(map);
            console.log('GeoJSON layer added to map successfully');
            console.log('Layer bounds:', geoJsonLayer.getBounds());
            console.log('Map bounds:', map.getBounds());
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            alert('Failed to load map data. Please check the console for details.');
        });

    // Helper functions
    function getDescription(zoneType) {
        const descriptions = {
            'permitted': 'STRs are permitted with basic registration',
            'restricted': 'STRs require planning permission or permits',
            'not-permitted': 'STRs are not currently permitted in this area'
        };
        return descriptions[zoneType] || 'STR status varies by local authority';
    }

    function getRate(areaName) {
        const rates = {
            'Greater London': '£120',
            'Manchester': '£65',
            'Birmingham': '£80',
            'Edinburgh': '£85',
            'Glasgow': '£75',
            'Cardiff': '£70',
            'Belfast': '£75'
        };
        return rates[areaName] || '£75';
    }

    function getCouncil(areaName) {
        return `${areaName} Council`;
    }

    // Search functionality
    document.getElementById('search-btn').addEventListener('click', function () {
        const postcode = document.getElementById('postcode-search').value.trim();
        if (postcode) {
            searchLocation(postcode);
        }
    });

    document.getElementById('postcode-search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const postcode = this.value.trim();
            if (postcode) {
                searchLocation(postcode);
            }
        }
    });

    // Popup functionality
    document.getElementById('popup-close').addEventListener('click', function () {
        document.getElementById('area-popup').style.display = 'none';
    });

    function searchLocation(postcode) {
        // Mock search - in production, use a geocoding service
        const mockResults = {
            'M1': { lat: 53.4808, lng: -2.2426, area: 'Manchester' },
            'SW1': { lat: 51.5074, lng: -0.1278, area: 'Greater London' },
            'B1': { lat: 52.4793, lng: -1.9026, area: 'Birmingham' },
            'EH1': { lat: 55.9533, lng: -3.1883, area: 'Edinburgh' }
        };

        const result = mockResults[postcode.toUpperCase()];
        if (result) {
            map.setView([result.lat, result.lng], 10);
        } else {
            alert('Postcode not found. Please try a valid UK postcode.');
        }
    }

    function showAreaPopup(zone) {
        const popup = document.getElementById('area-popup');
        const title = document.getElementById('popup-title');
        const description = document.getElementById('popup-description');
        const link = document.getElementById('popup-link');
        const rate = document.getElementById('popup-rate');

        title.textContent = `${zone.name} - ${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}`;
        description.textContent = zone.description;
        link.href = '#';
        link.textContent = `View ${zone.council}`;
        rate.textContent = zone.rate;

        popup.style.display = 'block';
    }
});
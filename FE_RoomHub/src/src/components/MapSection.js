import "./MapSection.css";

const MapSection = ({
    latitude,
    longitude,
    address
}) => {

    if (!latitude || !longitude) {
        return (
            <section className="map-section">
                <div className="map-header">
                    <span>Location</span>
                    <h2>Map</h2>
                </div>

                <p>
                    Location data unavailable
                </p>
            </section>
        );
    }

    return (
        <section className="map-section">

            <div className="map-header">
                <span>Location</span>
            </div>

            <div className="map-container">
                <iframe
                    title="boarding-house-map"
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                    loading="lazy"
                    allowFullScreen
                />
            </div>

            <p className="map-address">
                {address}
            </p>

        </section>
    );
};

export default MapSection;
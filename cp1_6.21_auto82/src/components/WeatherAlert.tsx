import React, { useState } from "react";

interface Coordinates {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

interface WeatherAlert {
  id: string;
  type: string;
  level: "yellow" | "red";
  areaName: string;
  coordinates: Coordinates;
  description: string;
}

interface WeatherAlertProps {
  alerts: WeatherAlert[];
}

function getWorstLevel(alerts: WeatherAlert[]): "none" | "yellow" | "red" {
  if (alerts.some((a) => a.level === "red")) return "red";
  if (alerts.some((a) => a.level === "yellow")) return "yellow";
  return "none";
}

function getLevelColor(level: "none" | "yellow" | "red"): string {
  switch (level) {
    case "red":
      return "#F44336";
    case "yellow":
      return "#FF9800";
    default:
      return "#4CAF50";
  }
}

const WeatherAlert: React.FC<WeatherAlertProps> = ({ alerts }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  const worstLevel = getWorstLevel(alerts);
  const iconColor = getLevelColor(worstLevel);
  const displayedAlerts = alerts.slice(0, 5);

  return (
    <>
      <style>{`
        @keyframes waModalPopIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .wa-cloud-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          clip-path: polygon(
            20% 80%, 5% 65%, 0% 50%, 5% 35%, 15% 25%,
            25% 22%, 35% 10%, 50% 5%, 65% 8%, 75% 18%,
            80% 22%, 90% 25%, 95% 35%, 100% 50%, 95% 65%, 80% 80%
          );
        }
        .wa-cloud-btn:hover { transform: scale(1.1); }

        .wa-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 280px;
          background: #FFFFFFCC;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 16px;
          z-index: 1000;
          font-family: sans-serif;
        }

        .wa-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wa-modal {
          width: 400px;
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          animation: waModalPopIn 0.3s ease forwards;
        }

        .wa-alert-item {
          height: 60px;
          border-radius: 8px;
          background: #FFFFFFAA;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wa-alert-item:hover { background: #FFFFFFEE; }

        .wa-close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          line-height: 1;
          padding: 0;
        }

        .wa-mobile-label {
          display: none;
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        @media (max-width: 767px) {
          .wa-cloud-btn {
            top: auto !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 80px !important;
            background: white !important;
            clip-path: none !important;
            border-radius: 16px 16px 0 0 !important;
            box-shadow: 0 -2px 12px rgba(0,0,0,0.1) !important;
          }
          .wa-panel {
            top: auto !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            border-radius: 16px 16px 0 0 !important;
            max-height: 60vh;
            overflow-y: auto;
          }
          .wa-modal {
            width: 90% !important;
            max-width: 400px;
          }
          .wa-mobile-label {
            display: block !important;
          }
        }
      `}</style>

      {!isExpanded && (
        <div
          className="wa-cloud-btn"
          style={{ backgroundColor: iconColor }}
          onClick={() => setIsExpanded(true)}
        >
          <span className="wa-mobile-label">⚠ 天气预警</span>
        </div>
      )}

      {isExpanded && (
        <div className="wa-panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>
              天气预警
            </span>
            <button className="wa-close-btn" onClick={() => setIsExpanded(false)}>
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="wa-alert-item"
                style={{
                  borderLeft: `8px solid ${
                    alert.level === "red" ? "#F44336" : "#FF9800"
                  }`,
                }}
                onClick={() => setSelectedAlert(alert)}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                  {alert.type}
                </span>
                <span style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {alert.areaName}
                </span>
              </div>
            ))}
          </div>

          {alerts.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: 13,
                padding: "12px 0",
              }}
            >
              暂无预警信息
            </div>
          )}
        </div>
      )}

      {selectedAlert && (
        <div className="wa-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: "#333" }}>
                {selectedAlert.type}
              </span>
              <button className="wa-close-btn" onClick={() => setSelectedAlert(null)}>
                ✕
              </button>
            </div>

            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "#FFF",
                background: selectedAlert.level === "red" ? "#F44336" : "#FF9800",
                marginBottom: 12,
              }}
            >
              {selectedAlert.level === "red" ? "红色预警" : "黄色预警"}
            </div>

            <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>
              <strong>区域：</strong>
              {selectedAlert.areaName}
            </div>

            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              {selectedAlert.description}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WeatherAlert;

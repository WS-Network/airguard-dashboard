"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";

interface MetricsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType?: "health" | "throughput" | "qos" | "interference" | "load" | null;
}

export default function MetricsInfoModal({
  isOpen,
  onClose,
  metricType,
}: MetricsInfoModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getMetricContent = () => {
    switch (metricType) {
      case "health":
        return {
          title: "Overall Network Health Index",
          color: "ag-lime",
          content: (
            <div className="space-y-3 text-ag-white/80">
              <p>
                This metric is an{" "}
                <strong>
                  aggregation of insights derived from the Anomaly Detection
                  Output and Event-Correlation Confidence across the network
                </strong>
                .
              </p>
              <div className="ml-4">
                <p className="mb-2">
                  <strong>Anomaly Detection Output</strong> is generated at each
                  device by applying statistical methods (e.g., moving averages
                  and thresholding),{" "}
                  <strong>
                    clustering algorithms, and machine learning classifiers
                  </strong>{" "}
                  to identify deviations and classify normal versus abnormal
                  signals in real-time data against baselines. This results in
                  an identification of &ldquo;unusual or problematic network
                  behavior&rdquo;.
                </p>
                <p className="mb-2">
                  <strong>Event-Correlation Confidence</strong> is the
                  probability (P) that a detected noise source originates from a
                  remote node, defined as &ldquo;P(noise source =
                  remote)&rdquo;. It is{" "}
                  <em>
                    dynamically updated using a Bayesian approach based on a
                    feedback loop
                  </em>
                  .
                </p>
                <p>
                  <strong>Calculation:</strong> The Overall Network Health Index
                  represents a{" "}
                  <em>
                    weighted composite score or index. It involves aggregating
                    the severity and frequency of detected anomalies across all
                    AirGuard devices
                  </em>
                  , inversely weighted by the Event-Correlation Confidence for
                  attributed noise sources. A network with fewer or
                  well-understood anomalies (high confidence in source
                  correlation) would result in a higher Overall Network Health
                  Index.
                </p>
              </div>
            </div>
          ),
        };
      case "throughput":
        return {
          title: "Average Network Throughput",
          color: "ag-neon-green",
          content: (
            <div className="space-y-3 text-ag-white/80">
              <p>
                This metric{" "}
                <em>
                  reflects the collective data flow and performance across all
                  AirGuard devices
                </em>
                , demonstrating the &ldquo;unlocked throughput&rdquo; benefit.
              </p>
              <div className="ml-4">
                <p className="mb-2">
                  <strong>Component:</strong> The &ldquo;Load estimate of
                  co-channel APs&rdquo; derived from{" "}
                  <strong>Beacon/Data-Packet Rate</strong> is a key indicator.
                </p>
                <p>
                  <strong>Calculation:</strong> For each AirGuard device, its{" "}
                  <strong>
                    local throughput is measured or estimated using metrics like
                    Beacon/Data-Packet Rate
                  </strong>
                  . The{" "}
                  <strong>
                    Average Network Throughput is then calculated by summing the
                    individual throughput values from all AirGuard devices in
                    the network and dividing by the total number of active
                    devices
                  </strong>
                  .
                </p>
              </div>
            </div>
          ),
        };
      case "qos":
        return {
          title: "Network-Wide QoS Score",
          color: "ag-neon-blue",
          content: (
            <div className="space-y-3 text-ag-white/80">
              <p>
                This metric{" "}
                <strong>aggregates QoS Violations across the network</strong>,
                providing an &ldquo;instant indicator of service quality&rdquo;.
              </p>
              <div className="ml-4">
                <p className="mb-2">
                  <strong>Component:</strong> <strong>QoS Violations</strong>{" "}
                  tracks &ldquo;Dropped/lag incidents per channel,&rdquo;
                  particularly for latency-critical applications.
                </p>
                <p>
                  <strong>Calculation:</strong> For each channel monitored by an
                  AirGuard device,{" "}
                  <strong>
                    the number of QoS Violations (dropped/lag incidents) is
                    recorded
                  </strong>
                  . To derive a score, one would{" "}
                  <strong>calculate the success rate per channel</strong> (e.g.,
                  (Total Expected Packets - QoS Violations) / Total Expected
                  Packets). The{" "}
                  <strong>
                    Network-Wide QoS Score would then be the averaged
                    QoS_Success_Rate across all channels and devices in the
                    network, typically expressed as a percentage
                  </strong>
                  .
                </p>
              </div>
            </div>
          ),
        };
      case "interference":
        return {
          title: "Overall Interference Level",
          color: "ag-orange",
          content: (
            <div className="space-y-3 text-ag-white/80">
              <p>
                This metric provides a{" "}
                <em>
                  live snapshot of the radio frequency interference environment
                </em>{" "}
                across the network.
              </p>
              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-semibold text-ag-orange mb-2">
                    Primary Calculation (ChannelStress):
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <strong>ChannelStress</strong> is a combined metric
                      defined as{" "}
                      <strong>
                        Channel Utilisation · Client Count per Channel /
                        Signal-to-Noise Ratio (SNR)
                      </strong>
                      .
                    </li>
                    <li>
                      Channel Utilisation is the &ldquo;% Airtime consumption on
                      each channel&rdquo;.
                    </li>
                    <li>
                      Client Count per Channel represents the &ldquo;Current
                      load &amp; density&rdquo;.
                    </li>
                    <li>
                      Signal-to-Noise Ratio (SNR) is measured &ldquo;on current
                      &amp; candidate channels&rdquo;.
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>
                      To get the Overall Interference Level using ChannelStress,
                      calculate the ChannelStress for each active channel on
                      every AirGuard device and then average these values across
                      the entire network
                    </strong>
                    . A higher average ChannelStress indicates a higher overall
                    interference level.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-ag-orange mb-2">
                    Alternative/Complementary Calculation (Noise Floor):
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Each AirGuard device measures the{" "}
                      <strong>Noise Floor</strong>, which is the
                      &ldquo;Background RF noise baseline&rdquo;.
                    </li>
                    <li>
                      The{" "}
                      <strong>
                        Overall Interference Level using Noise Floor would be
                        the average of the Noise Floor readings from all
                        AirGuard devices across the network
                      </strong>
                      .
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        };
      case "load":
        return {
          title: "Predicted Network Load",
          color: "ag-green",
          content: (
            <div className="space-y-3 text-ag-white/80">
              <p>
                This metric{" "}
                <strong>
                  displays the Predicted Load Growth across the network
                </strong>
                , enabling proactive capacity management.
              </p>
              <div className="ml-4">
                <p className="mb-2">
                  <strong>Component:</strong>{" "}
                  <strong>Predicted Load Growth</strong> is defined as a
                  &ldquo;Forecast of client demand&rdquo;.
                </p>
                <p>
                  <strong>Calculation:</strong> This is not a simple arithmetic
                  formula but an output from AirGuard&apos;s{" "}
                  <em>
                    AI/ML models. These models leverage &ldquo;Supervised and
                    Unsupervised Learning&rdquo;, &ldquo;Deep Learning
                    Architectures&rdquo;, and &ldquo;Reinforcement
                    Learning&rdquo;
                  </em>{" "}
                  to recognize patterns and make predictive insights from
                  historical data. They also incorporate{" "}
                  <em>
                    &ldquo;Time-Series Analysis&rdquo; and &ldquo;Temporal
                    Features&rdquo; like &ldquo;Rolling averages &amp;
                    time-of-day indicators&rdquo;
                  </em>{" "}
                  to capture diurnal patterns and forecast future client demand
                  based on existing Client Count per Channel and
                  Beacon/Data-Packet Rate trends. The{" "}
                  <strong>
                    Predicted Network Load represents the aggregated forecast
                    percentage or value generated by these predictive machine
                    learning models for the entire network
                  </strong>
                  .
                </p>
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Network Metrics Information",
          color: "ag-green",
          content: (
            <div className="text-ag-white/80">
              <p>Select a specific metric to view detailed information.</p>
            </div>
          ),
        };
    }
  };

  const metricInfo = getMetricContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="bg-ag-black/95 backdrop-blur-md border border-ag-green/30 hover:border-ag-green/50 rounded-xl p-6 w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-ag-green/20">
                    <Info className="w-6 h-6 text-ag-green" />
                  </div>
                  <h2 className="text-2xl font-bold text-ag-white">
                    {metricInfo.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                <div
                  className={`p-6 rounded-lg bg-ag-black/40 border border-${metricInfo.color}/20`}
                >
                  <h3
                    className={`text-xl font-bold text-${metricInfo.color} mb-4`}
                  >
                    {metricInfo.title}
                  </h3>
                  {metricInfo.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

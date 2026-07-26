import React from "react";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface EmptyPlayerOverlayProps {
  onPressInteraction?: () => void;
  isWebInteractionRequired?: boolean;
}

export const EmptyPlayerOverlay: React.FC<EmptyPlayerOverlayProps> = ({
  onPressInteraction,
  isWebInteractionRequired,
}) => {
  if (isWebInteractionRequired) {
    return (
      <TouchableWithoutFeedback onPress={onPressInteraction}>
        <View style={styles.interactionOverlay}>
          <View style={styles.interactionIconCircle}>
            <Text style={styles.interactionIconText}>🔊</Text>
          </View>
          <Text style={styles.interactionTitle}>Nhấp để kích hoạt âm thanh</Text>
          <Text style={styles.interactionSubtitle}>
            Trình duyệt yêu cầu tương tác của người dùng để phát video có âm thanh. Nhấp vào bất kỳ đâu để bắt đầu trình chiếu.
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIconText}>📺</Text>
      </View>
      <Text style={styles.emptyTitle}>Chưa có nội dung trình chiếu</Text>
      <Text style={styles.emptySubtitle}>
        Thiết bị hiện đang ở chế độ chờ. Vui lòng liên kết thiết bị với CMS và
        gán lịch phát để cập nhật nội dung.
      </Text>
      <Text style={styles.emptyHint}>
        Chạm vào màn hình để mở bảng cấu hình
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyHint: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
    textTransform: "uppercase",
  },
  interactionOverlay: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  interactionIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  interactionIconText: {
    fontSize: 40,
  },
  interactionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  interactionSubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 22,
  },
});

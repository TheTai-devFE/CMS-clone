import React from "react";
import { View, Platform, StyleSheet, Image } from "react-native";
import { WebView } from "react-native-webview";
import { VideoView, VideoPlayer } from "expo-video";
import { PlayerPlaylistItem } from "../utils/syncManager";

interface MediaRenderLayersProps {
  currentItem: PlayerPlaylistItem;
  player: VideoPlayer;
  videoWallCrop: {
    mediaWidth: string;
    mediaHeight: string;
    left: string;
    top: string;
  } | null;
}

export const MediaRenderLayers: React.FC<MediaRenderLayersProps> = ({
  currentItem,
  player,
  videoWallCrop,
}) => {
  const cropStyle = videoWallCrop
    ? {
        position: "absolute" as const,
        width: videoWallCrop.mediaWidth as any,
        height: videoWallCrop.mediaHeight as any,
        left: videoWallCrop.left as any,
        top: videoWallCrop.top as any,
      }
    : { width: "100%" as const, height: "100%" as const };

  return (
    <View style={styles.mediaContainer}>
      {currentItem.type === "image" && (
        <View style={cropStyle}>
          <Image
            source={{ uri: currentItem.url }}
            style={styles.media}
            resizeMode={videoWallCrop ? "cover" : "contain"}
          />
        </View>
      )}

      {currentItem.type === "video" && (
        <View style={cropStyle}>
          <VideoView
            player={player}
            style={styles.media}
            nativeControls={false}
            contentFit={videoWallCrop ? "cover" : "contain"}
          />
        </View>
      )}

      {currentItem.type === "pdf" && (
        Platform.OS === "web" ? (
          <View style={cropStyle}>
            <iframe
              src={currentItem.url.includes("#") ? currentItem.url : `${currentItem.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000000" }}
              title="PDF Viewer"
            />
          </View>
        ) : (
          <WebView
            source={{
              uri: currentItem.url.startsWith("http")
                ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentItem.url)}`
                : currentItem.url,
            }}
            style={videoWallCrop ? cropStyle : { width: "100%", height: "100%", backgroundColor: "#000000" }}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            originWhitelist={["*"]}
          />
        )
      )}

      {currentItem.type === "url" && (
        Platform.OS === "web" ? (
          <View style={cropStyle}>
            <iframe
              src={currentItem.url}
              style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000000" }}
              title="Web URL Viewer"
            />
          </View>
        ) : (
          <WebView
            source={{ uri: currentItem.url }}
            style={videoWallCrop ? cropStyle : { width: "100%", height: "100%", backgroundColor: "#000000" }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            cacheEnabled
            scalesPageToFit={false}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mediaContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  media: {
    width: "100%",
    height: "100%",
  },
});

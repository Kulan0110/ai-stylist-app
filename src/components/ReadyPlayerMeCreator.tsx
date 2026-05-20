import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const ACCENT = '#7c6af5';
const BG     = '#0a0a14';

function buildRPMHtml(subdomain: string): string {
  const src = `https://${subdomain}.readyplayer.me/avatar?frameApi&clearCache`;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0a0a14;overflow:hidden}
iframe{position:fixed;top:0;left:0;width:100%;height:100%;border:none}
#loader{position:fixed;top:0;left:0;right:0;bottom:0;background:#0a0a14;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  font-family:system-ui;color:#7c6af5;font-size:14px}
</style>
</head>
<body>
<div id="loader">
  <svg width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="none" stroke="#7c6af5" stroke-width="3" stroke-dasharray="80 20">
      <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>
    </circle>
  </svg>
  <span>Ready Player Me ачаалж байна...</span>
</div>

<iframe
  id="rpm"
  src="${src}"
  allow="camera *; microphone *; autoplay; clipboard-write; encrypted-media"
  allowfullscreen
></iframe>

<script>
var frame = document.getElementById('rpm');
var loader = document.getElementById('loader');

frame.addEventListener('load', function() {
  loader.style.display = 'none';
  subscribe();
});

function subscribe() {
  var events = ['v1.avatar.exported', 'v1.user.set', 'v1.frame.ready'];
  events.forEach(function(ev) {
    frame.contentWindow.postMessage(
      JSON.stringify({ target: 'readyplayerme', type: 'subscribe', eventName: ev }),
      '*'
    );
  });
}

window.addEventListener('message', function(e) {
  try {
    var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (!data || !data.eventName) return;
    if (data.eventName === 'v1.frame.ready') subscribe();
    if (data.eventName === 'v1.avatar.exported') {
      var url = (data.data && data.data.url) ? data.data.url : '';
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'avatarExported', url: url }));
      }
    }
  } catch(err) {}
});
</script>
</body>
</html>`;
}

interface Props {
  subdomain?: string;
  onAvatarCreated?: (url: string) => void;
  onClose?: () => void;
}

export default function ReadyPlayerMeCreator({ subdomain = 'demo', onAvatarCreated, onClose }: Props) {
  const webViewRef = useRef<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [exported, setExported] = useState(false);

  function onMessage(e: any) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'avatarExported' && msg.url) {
        setExported(true);
        onAvatarCreated?.(msg.url);
      }
    } catch {}
  }

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={S.header}>
        <Text style={S.title}>🎭  3D Аватар үүсгэх</Text>
        <TouchableOpacity style={S.closeBtn} onPress={onClose}>
          <Text style={S.closeTx}>✕ Хаах</Text>
        </TouchableOpacity>
      </View>

      <View style={S.hint}>
        <Text style={S.hintTx}>
          📸 Зургаараа → Customize → Export дарна уу
        </Text>
      </View>

      <View style={S.webWrap}>
        {loading && (
          <View style={S.loadOverlay}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={S.loadTx}>Ready Player Me ачаалж байна...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ html: buildRPMHtml(subdomain), baseUrl: 'https://readyplayer.me' }}
          style={S.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={()  => setLoading(false)}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          androidLayerType="hardware"
          mixedContentMode="always"
          originWhitelist={['*']}
          allowsBackForwardNavigationGestures={false}
          onError={() => setLoading(false)}
        />
      </View>

      {exported && (
        <View style={S.successBar}>
          <Text style={S.successTx}>✓  Аватар амжилттай үүсгэгдлээ!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#16162a',
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,106,245,0.22)',
  },
  title:   { fontSize: 15, fontWeight: '800', color: '#e8e8f0' },
  closeBtn:{ backgroundColor: 'rgba(124,106,245,0.15)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(124,106,245,0.3)' },
  closeTx: { fontSize: 12, fontWeight: '700', color: ACCENT },

  hint:   { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(124,106,245,0.07)' },
  hintTx: { fontSize: 12, color: 'rgba(124,106,245,0.8)', textAlign: 'center' },

  webWrap:     { flex: 1, position: 'relative' },
  webView:     { flex: 1, backgroundColor: BG },
  loadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 10,
  },
  loadTx: { fontSize: 14, color: ACCENT, fontWeight: '600' },

  successBar: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderTopWidth: 1, borderTopColor: 'rgba(52,211,153,0.3)',
    paddingVertical: 12, alignItems: 'center',
  },
  successTx: { fontSize: 14, fontWeight: '700', color: '#34D399' },
});

const signalingServer = "wss://your-signaling-server.example.com"; // módosítsd
let peer = new RTCPeerConnection();
let channel;
let socket = new WebSocket(signalingServer);
let id = location.hash.substring(1) || Math.random().toString(36).substr(2, 6);
let isSender = location.pathname.includes("index");

socket.onopen = () => socket.send(JSON.stringify({ type: "join", id }));

socket.onmessage = async (event) => {
  let data = JSON.parse(event.data);
  if (data.type === "offer" && !isSender) {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", answer, id }));
  }
  if (data.type === "answer" && isSender) {
    peer.setRemoteDescription(new RTCSessionDescription(data.answer));
  }
  if (data.type === "candidate" && data.candidate) {
    peer.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

peer.onicecandidate = (e) => {
  if (e.candidate) {
    socket.send(JSON.stringify({ type: "candidate", candidate: e.candidate, id }));
  }
};

if (isSender) {
  channel = peer.createDataChannel("file");
  channel.onopen = () => console.log("csatorna nyitva");
} else {
  peer.ondatachannel = (e) => {
    channel = e.channel;
    channel.onmessage = (e) => {
      let blob = new Blob([e.data]);
      let a = document.getElementById("download");
      a.href = URL.createObjectURL(blob);
      a.style.display = "inline";
      a.textContent = "Letöltés";
    };
  };
}

async function startSending() {
  const file = document.getElementById("fileInput").files[0];
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.send(JSON.stringify({ type: "offer", offer, id }));
  document.getElementById("downloadLink").innerHTML =
    `Megosztási link: <a href="receiver.html#${id}" target="_blank">receiver.html#${id}</a>`;
  channel.onopen = () => channel.send(file);
}

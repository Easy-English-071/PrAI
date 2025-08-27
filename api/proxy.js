// File: /api/proxy.js

export default async function handler(request, response) {
  // Chỉ cho phép phương thức POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Lấy API key từ Biến môi trường trên Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ message: 'API key not configured' });
  }

  // Xác định URL của Google API dựa trên yêu cầu từ client
  // Client sẽ gửi một header 'X-Target-API' để cho biết cần gọi TTS hay Text
  const targetApi = request.headers['x-target-api'];
  let googleApiUrl;

  if (targetApi === 'tts') {
    googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  } else {
    // Mặc định là API văn bản
    googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  }

  try {
    // Gửi tiếp yêu cầu đến Google API với nội dung từ client
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    });

    const data = await googleResponse.json();

    // Nếu Google trả về lỗi, cũng trả lỗi về cho client
    if (!googleResponse.ok) {
        console.error('Google API Error:', data);
        return response.status(googleResponse.status).json(data);
    }

    // Gửi kết quả thành công từ Google về lại cho client
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
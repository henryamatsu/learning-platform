const { YoutubeTranscript } = require('youtube-transcript');

async function testTranscript() {
  try {
    console.log('Testing transcript extraction...');
    const transcript = await YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
    console.log('Success!');
    console.log('Length:', transcript.length);
    console.log('First few items:', transcript.slice(0, 3));
    
    const fullText = transcript.map(item => item.text).join(' ');
    console.log('Full text preview:', fullText.substring(0, 200) + '...');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTranscript();

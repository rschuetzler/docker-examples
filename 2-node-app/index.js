const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const quotes = [
  { text: "Treat yo self!", character: "Tom Haverford & Donna Meagle" },
  { text: "I have no idea what I'm doing, but I know I'm doing it really, really well.", character: "Andy Dwyer" },
  { text: "We need to remember what's important in life: friends, waffles, work. Or waffles, friends, work. Doesn't matter, but work is third.", character: "Leslie Knope" },
  { text: "I'm not interested in caring about people.", character: "April Ludgate" },
  { text: "There's nothing we can't do if we work hard, never sleep, and shirk all other responsibilities in our lives.", character: "Leslie Knope" },
  { text: "Everything hurts and I'm dying.", character: "Chris Traeger" },
  { text: "I call this turf 'n' turf. It's a 16 oz T-bone and a 24 oz porterhouse.", character: "Ron Swanson" },
  { text: "Capitalism: God's way of determining who is smart and who is poor.", character: "Ron Swanson" },
  { text: "I'm allergic to sushi. Every time I eat more than 80 sushis, I barf.", character: "Andy Dwyer" },
  { text: "Time is money, money is power, power is pizza, and pizza is knowledge.", character: "April Ludgate" },
  { text: "I am big enough to admit that I am often inspired by myself.", character: "Leslie Knope" },
  { text: "I don't even have time to tell you how wrong you are. Actually, it's gonna bug me if I don't.", character: "April Ludgate" },
  { text: "I tried to make ramen in the coffee pot and I broke everything.", character: "Andy Dwyer" },
  { text: "Fish meat is practically a vegetable.", character: "Ron Swanson" }
];

let visitCount = 0;

app.get('/', (req, res) => {
  visitCount++;
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Parks & Rec Quote Generator</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 700px;
          padding: 50px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        .subtitle {
          color: #666;
          margin-bottom: 40px;
          font-size: 1.1em;
        }
        .quote-box {
          background: #f8f9fa;
          border-left: 5px solid #667eea;
          padding: 30px;
          border-radius: 10px;
          margin: 30px 0;
        }
        .quote-text {
          font-size: 1.5em;
          color: #333;
          line-height: 1.6;
          margin-bottom: 20px;
          font-style: italic;
        }
        .quote-character {
          color: #667eea;
          font-weight: bold;
          font-size: 1.1em;
        }
        .refresh-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 1.1em;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          font-weight: bold;
        }
        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .stats {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏛️ Parks & Rec</h1>
        <div class="subtitle">Random Quote Generator</div>

        <div class="quote-box">
          <div class="quote-text">"${randomQuote.text}"</div>
          <div class="quote-character">— ${randomQuote.character}</div>
        </div>

        <button class="refresh-btn" onclick="location.reload()">Get Another Quote</button>

        <div class="stats">
          Total Visits: ${visitCount} | Hostname: ${require('os').hostname()}
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Parks & Rec Quote Generator running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});

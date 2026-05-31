---
title: StockSee
subtitle: Correlating real-world events with stock prices & RL/NLP prediction
tags: [Python, TensorFlow, Reinforcement Learning, NLP, Node.js, Web API]
order: 4
demoUrl: "https://stock-see.vercel.app/"
githubUrl: "https://github.com/AkshayG99/StockSee"
---
- Correlates real-world socioeconomic events with stock prices to show that price curves reflect industry trends, company earnings reports, and product releases.
- Provides a search interface where users query stock tickers (e.g., **AAPL**) to see a 2-year historical price chart populated with sentiment-analyzed news event nodes.
- Predicts future price trends 50 days out using a **TensorFlow LSTM model** based on sequential windows of 200 previous daily closing prices.
- Incorporates both closing prices and public news sentiment scores generated via a custom **NLP model** trained on public datasets.
- Trained on all 30 stocks in the **Dow Jones Industrial Average** to create a generalized and accurate prediction model.
- Supports local training configurations to further train and improve the prediction and sentiment analysis ML models with new ticker entries.
- Includes comparative performance graphs displaying training/validation loss and directional accuracy metrics.

![StockSee Machine Learning Dashboard](/stocksee_mockup.png)

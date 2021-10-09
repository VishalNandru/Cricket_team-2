const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putPlayerQuery = `
    UPDATE player_details
    SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT match_id AS matchId,
    match,year
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT match_details.match_id AS matchId,
    match_details.year,match_details.match
    FROM player_match_score INNER JOIN match_details ON 
    player_match_score.match_id = match_details.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const matchPlayer = await db.all(getPlayerMatchQuery);
  response.send(matchPlayer);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM player_match_score INNER JOIN player_details ON 
    player_match_score.player_id = player_details.player_id
    WHERE match_id = ${matchId};`;
  const matchPlayer = await db.all(getMatchPlayerQuery);
  response.send(matchPlayer);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS total_Score,
    SUM(player_match_score.fours) AS total_Fours,
    SUM(player_match_score.sixes) AS total_Sixes
    
    FROM player_match_score NATURAL JOIN player_details
    
    WHERE player_match_score.player_id = ${playerId};`;

  const playerScore = await db.get(getPlayerScoreQuery);
  response.send(playerScore);
});

module.exports = app;

const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(id) {
    const query = {
      text: 'SELECT playlists.id, name FROM playlists inner join users on users.id = playlists.owner where playlists.id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      console.log('playlist tidak ditemukan');
    }
    const rowId = result.rows[0].id;
    const rowName = result.rows[0].name;
    const rowUsername = result.rows[0].username;
    const querySong = {
      text: 'SELECT ps.id, title, performer from playlist_songs ps LEFT JOIN songs s on ps.song_id = s.id where playlist_id = $1',
      values: [id],
    };
    const resultSong = await this._pool.query(querySong);
    let _songs = [];
    if (resultSong.rowCount) {
      _songs = resultSong.rows;
    }
    const getSongMap = {
      id: rowId, name: rowName, username: rowUsername, songs: _songs,
    };
    return {
      playlist: getSongMap,
    };
  }
}

module.exports = PlaylistsService;

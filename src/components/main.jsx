import React from 'react';

const users = JSON.parse(window.localStorage.getItem('musicuserid'));
export default class Main extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            userid: users.id,
            username: users.name,
            activeId: 0
        }
    }
    async componentDidMount() {
        if(!window.localStorage.musiclist) {
            window.localStorage.setItem('musiclist', this.getplaylist())
        }
    }

    getplaylist = async () => {
        const datainfo = await fetch(`/api/music/getplay?uid=${this.state.userid}`, {method: 'get'});
        const newdata = await datainfo.json();
        let component = [];
        let playlist = newdata.result.playlist && newdata.result.playlist.map(item => {
            return fetch(`/api/music/getlist?id=${item.id}`, {method: 'get'}).then(res => res.json()).then(res => res.result.result)
        });
        let list = await Promise.all(playlist);
        list.map(item => {
            component.push({id: item.id, name: item.name, list: item.tracks})
        })
        window.localStorage.setItem('musiclist', JSON.stringify(component))
    }

    setHtml = () => {
        const h = JSON.parse(window.localStorage.getItem('musiclist')) || [];
        let component = [];
        h.map((item, index) => {
            component.push(
                <div key={item.id}>
                    <h3 className={this.state.activeId === item.id ? 'isactive': ''} onClick={() => this.changeshow(item.id)}>{item.name}</h3>
                    <ul className={this.state.activeId === item.id ? 'isactive': ''}>
                        {item.list.map((i) => (
                            <li onClick={() => this.goplay(i.id, index)} key={i.id}>{i.name}</li>
                        ))}
                    </ul>
                </div>
            )
        })
        return component;
    }

    changeshow = (id) => {
        let mid = id === this.state.activeId ? 0 : id
        this.setState({
            activeId: mid
        })
    }

    goplay = (id, index) => {
        this.props.history.push(`/musicing/${index}/${id}`)
    }

    render() {
        const {userid, username} = this.state;
        return (
            <div className="music_list">
                <h2>{username}的歌单</h2>
                {this.setHtml()}
            </div>
        )
    }
}
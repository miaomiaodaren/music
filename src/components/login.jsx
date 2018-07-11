import React from 'react';
import PropTypes from 'prop-types';
import {stringify} from 'qs';

export default class Logins extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: ''
        }
    }
    mlogin = () => {
        const {username, password} = this.state;
        fetch(`/api/music/login?username=${username}&password=${password}`, {
            method: 'get',
        }).then(res => res.json()).then(res => {
            console.info(res, 2222, res.status);
            if(res.status === 'success') {
                let lc = {id: res.result.account.id, name: res.result.profile.nickname}
                window.localStorage.setItem('musicuserid', JSON.stringify(lc));
                this.props.history.push('/')
            }
        })
    }
    userChange = (value, type) => {
        this.setState(type === 'user' ? {
            username: value.target.value
        } : {
            password: value.target.value
        })
    }
    
    getmusiclist = () => {
        fetch(`/api/music/getlist?id=403205847`, {
            method: 'get',
        }).then(res => res.json()).then(res=> {
            console.info(res, 888);
        })
    }
    render() {
        console.info(this.props, 222);
        const {username, password} = this.state;
        return (
            <div className="login">
                <div className="form">
                    <label>
                        帐号:
                        <input type="text" value={username} placeholder="请输入帐号" onChange={(event) => this.userChange(event, 'user')} />
                    </label>
                    <label>
                        密码:
                        <input type="password" value={password} placeholder="请输入密码" onChange={(event) => this.userChange(event, 'psw')} />
                    </label>
                    <button onClick={this.mlogin}>21312321</button>
                </div>
                <div className="222" onClick={this.getplaylist}>获取歌单</div>
                <div className="222" onClick={this.getmusiclist}>获取音乐列表</div>
            </div>
        )
    }
}
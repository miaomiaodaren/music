import React from 'react';
function transTime(time) { 
    let duration = parseInt(time, 10); 
    let minute = parseInt(duration/60, 10); 
    let sec = duration%60+''; 
    let isM0 = ':'; 
    if(minute === 0){ 
        minute = '00'; 
    } else if(minute < 10 ){ 
        minute = '0'+minute; 
    }
    if(sec.length === 1) {
        sec = '0' + sec; 
    } 
    return minute+isM0+sec 
}
export default class Musicing extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isplay: void 0,
            start_time: '00:00',
            end_time: '00:00',
            lrcline: 0,
            medisArray: [],   //歌词
            musicingid: this.props.match.params.id,
            musicname: '',
            isover: false,
            volume: 0.5,
            palyingtype: 0
        }
        
    }

    static playtype = ['列表循环', '随机播放', '单曲循环'];

    //歌词
    macklrc = async(newindex) => {
        const {musicingid} = this.state
        const lrc = await fetch(`/api/music/getlrc?id=${newindex ? newindex : musicingid}`, {method: 'get'}).then(res => res.json()).then(res => res.result.lyric)
        let singers = lrc ? lrc.split("\n") : '暂无歌词';
        let medisArray = Array.isArray(singers) ? [] : singers;
        if(Array.isArray(singers)) {
            singers.map(function(item) {
                let t = item.substring(item.indexOf('[') + 1, item.indexOf(']'));
                medisArray.push({
                    t: (t.split(":")[0] * 60 + parseFloat(t.split(":")[1])).toFixed(2),
                    c: item.substring(item.indexOf(']') + 1, item.length)
                })
                return medisArray
            });
        }
        if(newindex) {
            return medisArray
        }
        this.setState({
            medisArray: medisArray,
        })
    }

    static startX;
    static moveX;

    //是否播放
    changePlay = () => {
        this.setState((preState) => {
            return {isplay: !preState.isplay}
        }, () => {
            this.state.isplay ? this.audios.play() : this.audios.pause()
        })
    }

    async componentDidMount() {
        this.macklrc();
        const self = this;
        let music = await this.changeMusic('getname');
        this.setState({
            musicname: music.name
        })
        //获取歌曲的时长
        this.audios.addEventListener('loadedmetadata', function() {
            window.localStorage.setItem('singid', self.state.musicingid);
            self.setState({
                end_time: transTime(this.duration)
            })
        });
        this.audios.addEventListener('timeupdate', this.updatefun, false);
        this.audios.addEventListener("ended", () => {
            self.state.palyingtype === 0 ? this.changeMusic('next') : this.changeMusic('random');
        });
    }

    componentWillUnmount() {
        this.audios.removeEventListener('timeupdate', this.updatefun);
    }

    updatefun = () => {
        this.updateProgress();
        this.updateline();
    }

    //切换到上一首,下一首歌 
    changeMusic = async (type) => {
        const {musicingid, palyingtype} = this.state;
        const index = this.props.match.params.index || 0;
        const {list} = JSON.parse(window.localStorage.musiclist)[index];
        let musicindex = list.findIndex(item => {
            return musicingid == item.id
        });
        let musicview = list.find(item => {
            return musicingid == item.id
        })
        if(type === 'getname') {
            return musicview;
        }
        // type === 'random' ? Math.random() * list.length : 
        let newindex
        if(palyingtype === 1) {
            newindex = Math.random() * list.length;
        } else {
            newindex = musicindex === list.length ? 0 : type === 'pre' ? musicindex - 1 :  musicindex + 1;
        }
        let newlrc = await this.macklrc(list[newindex].id);
        this.setState({
            musicingid: list[newindex].id,
            isplay: true,
            medisArray: newlrc,
            musicname: list[newindex].name,
        }, () => {
            setTimeout(() => this.audios.play(), 200) 
        });
    }


    updateline = () => {
        const {lrcline, medisArray} = this.state;
        if(Array.isArray(medisArray)) {
            if(lrcline === medisArray.length -1 && this.audios.currentTime.toFixed(3) >= parseFloat(medisArray[lrcline].t) || lrcline === medisArray.length) {
                this.lrclineheight(lrcline)
                return false
            }
            if(parseFloat(medisArray[lrcline].t) <= this.audios.currentTime.toFixed(3) && this.audios.currentTime.toFixed(3) <= parseFloat(medisArray[lrcline+1].t)) {
                //第一次进来的时候，不需要加
                this.lrclineheight(lrcline + 1)
            }
        }
    }

    lrcscrolltop = () => {
        const {lrcline} = this.state;
        const lrcs = this.refs.lrcs;
        const lrc = this.refs.lrc;
        setTimeout(() => {
            lrcs.scrollTop = (lrc.getBoundingClientRect().height * lrcline) - (lrc.getBoundingClientRect().height * 2);
        }, 100)
    }

    setSingHtml = () => {
        const {medisArray} = this.state;
        let singer = [];
        if(Array.isArray(medisArray)) {
            medisArray.map((item, i)=> {
                singer.push(<div style={{whiteSpace: 'norma'}} key={`sing${i}`} 
                ref={(this.state.lrcline - 1 <= 0 ? 0 : this.state.lrcline === medisArray.length - 1 ? this.state.lrcline : this.state.lrcline - 1) === i ? 'lrc' : ''} 
                className={(this.state.lrcline - 1 <= 0 ? 0 : this.state.lrcline === medisArray.length - 1 ? this.state.lrcline : this.state.lrcline - 1) === i ? 'lineheight' : ''}>{item.c}</div>) 
            })
        } else {
            singer = <div ref="lrc" className="lineheight">{medisArray}</div>
        }
        return singer
    }

    lrclineheight = (ling) => {
        if(ling !== this.state.lrcline) {
            this.setState({
                lrcline: ling
            })
        }
    }

    //获取图片地址
    getImg = () => {
        const {musicingid} = this.state
        const index = this.props.match.params.index || 0;
        const {list} = JSON.parse(window.localStorage.musiclist)[index];
        let m = list.find(item => {
            return musicingid == item.id
        });
        return m.album.blurPicUrl;
    }

    changeWidth = (e) => {
        const target = e.currentTarget;
        const lingwdith = target.getBoundingClientRect().width;  //进度条的宽度
        const pddwidth = e.clientX - target.getBoundingClientRect().left;   //减去左边的空的间距react dom 查不到offsetX属性
        this.audios.currentTime = (pddwidth/lingwdith) * this.audios.duration;
    }

    //进度条更新
    updateProgress = () => {
        const {medisArray} = this.state
        var value = Math.round((Math.floor(this.audios.currentTime) / Math.floor(this.audios.duration)) * 100, 0);
        const newlrcnum = Array.isArray(medisArray) && medisArray.findIndex((value, index) => {
            return parseFloat(value.t) >= this.audios.currentTime.toFixed(3)
        });
        this.refs.line.style.width = value + '%'
        this.refs.atcmk.style.left = value + '%'
        this.setState({
            start_time: transTime(this.audios.currentTime),
            lrcline: newlrcnum === -1 ? medisArray.length - 1 : newlrcnum,  //如果已经在最后一句，就直接返回
        }, () => {
            this.lrcscrolltop()
        })
    }

    startTouch = (evt) => {
        evt.stopPropagation();
        this.audios.removeEventListener('timeupdate', this.updatefun);
        this.startX = this.refs.lines.getBoundingClientRect().left; //evt.touches[0].clientX;
    }

    moveTouch = (evt) => {
        let moveXx = evt.touches[0].clientX;
        let dissX = moveXx - this.startX;
        if(dissX > 0 ) {
            let lingwdith = this.refs.lines.getBoundingClientRect().width;  //进度条的宽度
            let disstime = dissX/lingwdith;
            this.moveX = disstime * this.audios.duration;
            if(disstime > 0 && disstime <= 1) {
                var value = Math.round((Math.floor(this.moveX ) / Math.floor(this.audios.duration)) * 100, 0);
                this.refs.line.style.width = value + '%'
                this.refs.atcmk.style.left = value + '%'
            } else if(disstime > 1) {
                this.moveX = this.audios.duration;
                this.refs.line.style.width = 100 + '%'
                this.refs.atcmk.style.left = 100 + '%'
            } else {
                this.moveX = 0
                this.refs.line.style.width = 0 + '%'
                this.refs.atcmk.style.left = 0 + '%'
            }
        } 
    }

    changVolume = (e) => {
        const target = e.currentTarget;
        const lingwdith = target.getBoundingClientRect().width;  //进度条的宽度
        const pddwidth = e.clientX - target.getBoundingClientRect().left;   //减去左边的空的间距react dom 查不到offsetX属性
        this.refs.volume.style.width = (pddwidth / lingwdith) * 100 + '%';
        this.setState({
            volume: pddwidth / lingwdith
        })
    }

    endTouch = (evt) => {
        this.audios.addEventListener('timeupdate', this.updatefun, false);
        this.audios.currentTime = this.moveX;
    }

    //修改播放模式
    changeType = () => {
        let len = Musicing.playtype.length - 1;
        const {palyingtype} = this.state;
        this.setState(preState => {
            return {palyingtype: len === preState.palyingtype ? 0 : preState.palyingtype + 1}
        })
    }

    render() {
        const {isplay,musicingid, volume, palyingtype} = this.state;
        return (
            <div id="music_view">
                <div className="goback" onClick={() => this.props.history.goBack()}>{`<返回`}</div>
                <div className='music_title'>{this.state.musicname}</div>
                <div className={`sing_bg ${isplay === undefined ? '' : 'at'} ${isplay === false ? 'anruning' : ''}`}>
                    <div className="sing_img">
                        <img alt="" src={this.getImg()} />
                    </div>
                </div>
                <div className="sinnger" ref="lrcs">
                    {this.setSingHtml()}
                </div>
                <div className="jidutiao">
                    <span className="start_time">{this.state.start_time}</span>
                    <div className="lines" ref="lines" onClick={this.changeWidth}>
                        <div className="muc_line"></div>
                        <div className="act_line" ref="line"></div>
                        <div className="act_mk" 
                            ref="atcmk" 
                            onTouchStart={this.startTouch} 
                            onTouchMove={this.moveTouch}
                            onTouchEnd={this.endTouch}>
                        </div>
                    </div>
                    <span className="end_time">{this.state.end_time}</span>
                </div>
                <div className="volume" onClick={this.changVolume}>
                    <div className={volume === 0 ? 'voline novoline' : 'voline'}></div>
                    <div className="actvoline" ref="volume"></div>
                </div>
                <div className='operation'>
                    <div className="prenext_css music_pre" onClick={() => this.changeMusic('pre')}></div>
                    <div className={isplay ? 'action_css musci_stop' : 'action_css musci_action'} onClick={this.changePlay}></div>
                    <div className="prenext_css music_next" onClick={() => this.changeMusic('next')}></div>
                    <div className="playtype" onClick={this.changeType}>{Musicing.playtype[palyingtype]}</div>
                </div>
                
                <audio ref={(audio) => this.audios = audio } loop={palyingtype === 2 ? true : false} volume={volume} onError={(e) => this.changeMusic('next')} loop={false} src={`http://music.163.com/song/media/outer/url?id=${musicingid}.mp3`}></audio >
            </div>
        )
    }
}
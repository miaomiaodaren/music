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
            musicingid: this.props.match.params.id
        }
    }

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

    //是否播放
    changePlay = () => {
        this.setState((preState) => {
            return {isplay: !preState.isplay}
        }, () => {
            this.state.isplay ? this.audios.play() : this.audios.pause()
        })
    }

    componentDidMount() {
        this.macklrc();
        const self = this;
        //获取歌曲的时长
        this.audios.addEventListener('loadedmetadata', function() {
            self.setState({
                end_time: transTime(this.duration)
            })
        });
        this.audios.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateline();
        }, false);
        this.audios.addEventListener("ended", async () => {
            //歌曲放完，判断当前的状态，然后进行切歌。如果是单曲循环则loop = true 即可
            const index = this.props.match.params.index || 0;
            const {list} = JSON.parse(window.localStorage.musiclist)[index];
            let musicindex = list.findIndex(item => {
                return this.state.musicingid == item.id
            });
            let newindex = musicindex === list.length ? 0 : musicindex + 1;
            let newlrc = await this.macklrc(list[newindex].id);
            console.info(newlrc, 9999999);
            this.setState({
                musicingid: list[newindex].id,
                isplay: true,
                medisArray: newlrc
            }, () => {
                setTimeout(() => this.audios.play(), 200) 
            });
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

    updateProgress = () => {
        const {medisArray} = this.state
        var value = Math.round((Math.floor(this.audios.currentTime) / Math.floor(this.audios.duration)) * 100, 0);
        const newlrcnum = Array.isArray(medisArray) && medisArray.findIndex((value, index) => {
            return parseFloat(value.t) >= this.audios.currentTime.toFixed(3)
        })
        this.refs.line.style.width = value + '%'
        this.setState({
            start_time: transTime(this.audios.currentTime),
            lrcline: newlrcnum === -1 ? medisArray.length - 1 : newlrcnum,  //如果已经在最后一句，就直接返回
        }, () => {
            this.lrcscrolltop()
        })
    }

    lrcscrolltop = () => {
        const {lrcline} = this.state;
        const lrcs = this.refs.lrcs;
        const lrc = this.refs.lrc;
        setTimeout(() => {
            lrcs.scrollTop = (lrc.getBoundingClientRect().height * lrcline) - (lrc.getBoundingClientRect().height * 2);
        }, 100)
    }

    changeWidth = (e) => {
        const target = e.target;
        const lingwdith = target.getBoundingClientRect().width;  //进度条的宽度
        const pddwidth = e.clientX - target.getBoundingClientRect().left;   //减去左边的空的间距react dom 查不到offsetX属性
        // const rate = (pddwidth - (target.getBoundingClientRect().width - lingwdith) / 2) / lingwdith;
        this.audios.currentTime = (pddwidth/lingwdith) * this.audios.duration;
        // this.updateProgress();
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

    render() {
        const {isplay,musicingid} = this.state;
        return (
            <div id="music_view">
                <div className={`sing_bg ${isplay === undefined ? '' : 'at'} ${isplay === false ? 'anruning' : ''}`}>
                    <div className="sing_img">
                        {/* <img alt="" src={require('../static/images/3.jpg')} /> */}
                        <img alt="" src={this.getImg()} />
                    </div>
                </div>
                <div className="sinnger" ref="lrcs">
                    {this.setSingHtml()}
                </div>
                <div className="jidutiao">
                    <span className="start_time">{this.state.start_time}</span>
                    <div className="lines" onClick={this.changeWidth}>
                        <div className="muc_line"></div>
                        <div className="act_line" ref="line"></div>
                    </div>
                    <span className="end_time">{this.state.end_time}</span>
                </div>
                <div className="musci_action" onClick={this.changePlay}></div>
                <audio ref={(audio) => this.audios = audio } loop={false} src={`http://music.163.com/song/media/outer/url?id=${musicingid}.mp3`}></audio >
            </div>
        )
    }
}
import React from 'react';
let singer = require('../static/gxr.json');
let medisArray = [];
let singers = singer.lyric.split("\n");
//生成一个数组,分别存歌曲时间及歌词
singers.map(function(item) {
    let t = item.substring(item.indexOf('[') + 1, item.indexOf(']'));
    medisArray.push({
        t: (t.split(":")[0] * 60 + parseFloat(t.split(":")[1])).toFixed(2),
        c: item.substring(item.indexOf(']') + 1, item.length)
    })
})

console.info(medisArray, 333, singers, medisArray[21]);

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
        }
    }
    componentDidMount() {
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
    }
    changePlay = () => {
        this.setState((preState) => {
            return {isplay: !preState.isplay}
        }, () => {
            this.state.isplay ? this.audios.play() : this.audios.pause()
        })
    }

    updateline = () => {
        const {lrcline} = this.state;
        if(lrcline === medisArray.length -1 && this.audios.currentTime.toFixed(3) >= parseFloat(medisArray[lrcline].t) || lrcline === medisArray.length) {
            this.lrclineheight(lrcline)
            return false
        }
        if(parseFloat(medisArray[lrcline].t) <= this.audios.currentTime.toFixed(3) && this.audios.currentTime.toFixed(3) <= parseFloat(medisArray[lrcline+1].t)) {
            //第一次进来的时候，不需要加
            this.lrclineheight(lrcline + 1)
        }
    }

    updateProgress = () => {
        var value = Math.round((Math.floor(this.audios.currentTime) / Math.floor(this.audios.duration)) * 100, 0);
        const newlrcnum = medisArray.findIndex((value, index) => {
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
        const rate = (pddwidth - (target.getBoundingClientRect().width - lingwdith) / 2) / lingwdith;
        this.audios.currentTime = (pddwidth/lingwdith) * this.audios.duration;
        // this.updateProgress();
    }

    setSingHtml = () => {
        let singer = [];
        medisArray.map((item, i)=> {
            singer.push(<div key={`sing${i}`} 
            ref={(this.state.lrcline - 1 <= 0 ? 0 : this.state.lrcline === medisArray.length - 1 ? this.state.lrcline : this.state.lrcline - 1) === i ? 'lrc' : ''} 
            className={(this.state.lrcline - 1 <= 0 ? 0 : this.state.lrcline === medisArray.length - 1 ? this.state.lrcline : this.state.lrcline - 1) === i ? 'lineheight' : ''}>{item.c}</div>) 
        })
        return singer
    }

    lrclineheight = (ling) => {
        if(ling !== this.state.lrcline) {
            this.setState({
                lrcline: ling
            })
        }
    }

    render() {
        const {isplay} = this.state;
        return (
            <div id="music_view">
                <div className={`sing_bg ${isplay === undefined ? '' : 'at'} ${isplay === false ? 'anruning' : ''}`}>
                    <div className="sing_img">
                        <img alt="" src={require('../static/images/3.jpg')} />
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
                <audio ref={(audio) => this.audios = audio } loop={true} src={require('../../src/static/gxr.mp3')}></audio >
            </div>
        )
    }
}
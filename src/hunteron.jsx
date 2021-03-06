/**
 * Copyright (C) 2014 yanni4night.com
 * hunteron.jsx
 *
 * changelog
 * 2015-12-21[23:58:37]:revised
 * 2016-09-04[23:34:24]:port to new api
 *
 * @author yanni4night@gmail.com
 * @version 1.0.1
 * @since 1.0.0
 */

var DEBUG = false;

var pageSize = 100;

function getQueryUrl(start, ps, keyword) {
    return 'http://wa.hunteron.com/api/v1/position/query?_t=' + Date.now() + '&cityId=30101&size=' +
        (ps || pageSize) + '&start=' + start + (keyword ? '&query=' + encodeURIComponent(keyword) : '');
}

function queryJobs(cb, keyword) {
    var jobList = [];

    $.getJSON(getQueryUrl(0, 1, keyword)).done(function(ret) {

        if (!ret || !ret.success) {
            return cb(new Error(ret && ret.message || '未知错误'));
        }

        var total = ret.data.total;
        var remainQueries = DEBUG ? 1 : Math.ceil((total - 1)/ pageSize);

        if (ret.data && Array.isArray(ret.data.positions)) {
            jobList = jobList.concat(ret.data.positions);
        }

        var queries = [];
        var startPos = 2;
        for (var i = 0; i < remainQueries; startPos += pageSize, ++i) {
            queries.push($.getJSON(getQueryUrl(startPos, pageSize, keyword)));
        }

        $.when.apply($, queries).done(function() {
            Array.prototype.map.call(queries.length > 1 ? arguments : [Array.prototype.slice.call(arguments)], function(rets) {
                var ret;
                if(Array.isArray(rets)){
                    ret = rets[0];
                } else {
                    ret = rets;
                }

                if (ret && ret.data && Array.isArray(ret.data.positions)) {
                    jobList = jobList.concat(ret.data.positions);
                }
            });
            var finalJobs = jobList.filter(function(job) {
                var disableCompanyNames = '腾讯,百度,阿里,友盟,高德,神马,蚂蚁'.split(',');
                return !disableCompanyNames.some(function(key) {
                    return ~job.enterpriseName.indexOf(key);
                });
            }).map(function(item) {
                return item.positionId;
            });

            cb(null, finalJobs);
        });

    }).fail(function() {
        cb(new Error('fail'));
    });
}

function queryJobDetail(id) {
    return new Promise(function (resolve) {
        $.getJSON('http://wa.hunteron.com/api/v1/position/detail?_t=' + Date.now() + '&positionId=' +
            id).done(function (data) {
            resolve(data);
        });
    });
}

function fetch (keyword) {
    return new Promise(function(resolve, reject) {
        queryJobs(function(err, jobIds) {
            if (err) {
                reject(err);
            } else {
                resolve(jobIds);
            }
        }, keyword);
    });
}


var ItemInfo = React.createClass({
    render: function () {
        var classNames = ['item', 'text'];
        if ('extraClass' in this.props) {
            classNames.push(this.props.extraClass);
        }
        return (<div className={classNames.join(' ')}>{this.props.keyName}：{this.props.value}</div>);
    }
});

var BasicInfo = React.createClass({
    render: function () {
        var annualSalary = '￥' + this.props.item.minShowAnnualSalary+"~￥"+this.props.item.maxShowAnnualSalary;
        return (
            <fieldset className="info-block clearfix">
                <legend>基本信息</legend>
                <ItemInfo keyName="预计年薪" value={annualSalary}></ItemInfo>
                <ItemInfo keyName="所在地" value={this.props.item.location}></ItemInfo>
                <ItemInfo keyName="汇报对象" value={this.props.item.reportTo}></ItemInfo>
                <ItemInfo keyName="所属部门" value={this.props.item.department}></ItemInfo>
                <ItemInfo keyName="招聘人数" value={this.props.item.headCount + '人'}></ItemInfo>
                <ItemInfo keyName="下属团队" value={this.props.item.subordinate}></ItemInfo>
            </fieldset>
            );
    }
});

var CommissionPolicy = React.createClass({
    commission: function () {
        if(this.props.item.percentageNumbric) {
            return this.props.item.percentageNumbric + '%';
        } else {
            return '￥' + this.props.item.fixedRewardAmount;
        }
    },
    guaranteeTime: function () {
        return this.props.item.guaranteeTime ? this.props.item.guaranteeTime + '个月' : this.props.contract.guaranteeMonths +
            '个月';
    },
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>佣金政策</legend>
                <ItemInfo keyName="佣金" extraClass='hide' value={this.commission()}></ItemInfo>                
                <ItemInfo keyName="保证期" value={this.guaranteeTime()}></ItemInfo>                
            </fieldset>
            );
    }
});

var JobDescription = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>职位描述</legend>
                <div className="text article">{this.props.item.jobDescription}</div>
            </fieldset>
            );
    }
});

var JobRequirement = React.createClass({
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>任职要求</legend>
                <div className="text article">{this.props.item.jobRequirement}</div>
            </fieldset>
            );
    }
});

var PostRequirement = React.createClass({
    degreeRequired: function (id) {
        var e = ["", "本科", "研究生", "硕士", "博士", "博士后", "MBA", "中专", "大专", "初中", "高中"];
        return e[id] || '';
    },
    genderRequired: function (id) {
        var e = ["不限", "男", "女"];
        return e[id] || '';
    }, 
    workExpRequired: function (id) {
        var n = {
            0: "不限年限",
            1: "1年以上",
            2: "2年以上",
            3: "3年以上",
            4: "4年以上",
            5: "5年以上",
            6: "6年以上",
            7: "7年以上"
        };
        return n[id] || ''
    },
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>岗位要求</legend>
                <ItemInfo keyName="学历" value={this.degreeRequired(this.props.item.degreeRequired)}></ItemInfo>
                <ItemInfo keyName="语言要求" value={this.props.item.languageRequired}></ItemInfo>
                <ItemInfo keyName="性别" value={this.genderRequired(this.props.item.genderRequired)}></ItemInfo>
                <ItemInfo keyName="工作年限" value={this.workExpRequired(this.props.item.workExpRequired)}></ItemInfo>
                <ItemInfo keyName="面试流程" value={this.props.item.interviewTimes + '面'}></ItemInfo>
            </fieldset>
            );
    }
});

var ResearchInfo = React.createClass({
    rawMarkup: function () {
        var rawMarkup = this.props.item.importantMsg||'无';
        return { __html: rawMarkup };
    },
    render: function () {
        return (
            <fieldset className="info-block clearfix">
                <legend>调研信息</legend>
                <div className="text article" contentEditable="true" dangerouslySetInnerHTML={this.rawMarkup()} ></div>
            </fieldset>
            );
    }
});

var EnterpriseInfo = React.createClass({
    getInitialState: function () {
        return {info: {}};
    },
    componentDidMount: function () {
        var id = this.props.enterpriseId;

        if (!this.constructor.__cache) {
            this.constructor.__cache = {};
        }

        if (id in this.constructor.__cache) {
            this.setState({
                info: this.constructor.__cache[id]
            });
        } else {
            $.getJSON('http://wa.hunteron.com/api/v1/enterprise/detail/getById?_t=' + Date.now() + '&enterpriseId=' +
                id).done(function (ret) {
                this.setState({
                    info: ret.data
                });
                this.constructor.__cache[id] = ret.data;
            }.bind(this));
        }
    },
    scale: function (scaleId) {
        return ["1-49人", "50-99人", "100-499人", "500-999人", "1000-4999人", "5000-9999人", "10000+人"][scaleId] || '';
    },
    developStatus: function(developStatusId) {
        var e = {
            1: "未融资",
            2: "天使轮",
            3: "A轮",
            4: "B轮",
            5: "C轮",
            6: "D轮及以上",
            7: "上市公司"
        };
        return e[developStatusId] || '';
    },
    companyNature: function (companyNatureId) {
        var e = ["外商独资/外企办事处", "国内上市公司", "中外合资", "政府机关", "国有企业", "民企/私营企业", "外企代表处", "其他", "非赢利机构"];
        return e[companyNatureId] || '';
    },
    render: function () {
         return (
            <fieldset className="info-block clearfix">
                <legend>公司信息</legend>
                <div className="text article">
                    <h2>{this.state.info.displayName}</h2>
                    <h6>地址：{this.state.info.address}</h6>
                    <div className="tags">
                        <span className="tag">规模：{this.scale(this.state.info.scale)}</span>
                        <span className="tag">阶段：{this.developStatus(this.state.info.developStatus)}</span>
                        <span className="tag">性质：{this.companyNature(this.state.info.style)}</span>
                    </div>
                    {this.state.info.introduce}
                </div>
            </fieldset>
            );
    }
});

var Cv = React.createClass({
    render: function () {
        return (
            <div className="cv">
                <h1>{this.props.item.positionId}:<a href={"http://hd.hunteron.com/#/positions/detail/" + this.props.item.positionId} target="_blank">{this.props.item.positionTitle}</a></h1>
                <BasicInfo item={this.props.item}></BasicInfo>
                <CommissionPolicy item={this.props.item} contract={this.props.contract}></CommissionPolicy>
                <JobDescription item={this.props.item}></JobDescription>
                <JobRequirement item={this.props.item}></JobRequirement>
                <PostRequirement item={this.props.item}></PostRequirement>
                <ResearchInfo item={this.props.item}></ResearchInfo>
                <EnterpriseInfo enterpriseId={this.props.item.enterpriseId}></EnterpriseInfo>
            </div>
            );
    }
});

var Page = React.createClass({
    _isSearching: false,
    getInitialState: function () {
        return {
            details: [],
            success: 0,
            total: 0,
            failed: 0,
            msg: null
        };
    },
    _componentDidMount: function (keyword) {
        document.title = keyword;
        fetch(keyword).then(function (jobIds) {
            this.setState({
                total: jobIds.length
            });
            jobIds.forEach(function(id){
                queryJobDetail(id).then(function(ret){
                    this.setState({
                        details: this.state.details.concat(ret.data),
                        success: this.state.success + 1,
                    });
                }.bind(this),function(){
                    this.setState({
                        failed: this.state.failed + 1
                    });
                }.bind(this));
            }.bind(this));
            this._isSearching = false;
        }.bind(this), function(e){
            this.setState({
                msg: e.message
            });
            this._isSearching = false;
        }.bind(this));
    },
    onSearch: function (e) {
        if (this._isSearching) {
            return;
        } else {
            this._isSearching = true;
            this._componentDidMount(this.refs.keyword.value.trim());
        }
    },
    render: function () {
        var cvs = this.state.details.map(function(detail){
            return (<Cv item={detail.position} contract={detail.contract}></Cv>);
        });

        return (
            <div className="page">
                <nav>成功：{this.state.success}，失败：{this.state.failed}，总数：{this.state.total}
                    <a href="http://hd.hunteron.com/" className="msg">{this.state.msg}</a>
                    <input type="text" id="keyword" ref="keyword" placeholder="关键词"/>
                    <button className="search" onClick={this.onSearch.bind(this)}>搜索</button>
                </nav>
                <div className="content">{cvs}</div>
            </div>
            );
    }
});

ReactDOM.render(
  <Page />,
  document.getElementById('content')
);
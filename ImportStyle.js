import React, { Component } from 'react'
import hoistStatics from 'hoist-non-react-statics'

/*
ImportStyle         适用于普通组件
ImportStyleRoot     适用于最外层组件
*/

class StyleContainer extends Component {

    static contextTypes = {
        appendStyle: React.PropTypes.func,
        getStyle: React.PropTypes.func
    }

    render () {
        const styles = this.context.getStyle()

        let styleTags = []
        for(let name in styles){
            let id = name
            let s = styles[name].css
                s = s.substr(1, s.length)
                s = s.substr(0, s.length - 1)

            styleTags.push(
                <style key={id} id={id}>{s}</style>
            )
        }

        return (
            <div id="styleCollection">{styleTags}</div>
        )
    }
}

export const ImportStyle = (styles) => (StyleWrappedComponent) => {

    class ImportStyle extends Component {

        static contextTypes = {
            appendStyle: React.PropTypes.func,
            removeStyle: React.PropTypes.func
        }

        constructor (props, context) {
            super(props, context)

            this.state = {}
            this.classNameList = []
            this.styles = {}
        }

        componentWillMount () {

            styles = stylesHandleWapperCssLoader(styles)
            styles.forEach((style) => {
                this.classNameList.push(style.wrapper)
            })

            this.context.appendStyle(styles)
        }

        componentDidMount () {
            this.context.removeStyle(styles)
        }

        render () {

            const props = {
                ...this.props,
                ...this.state
            }

            return (
                <StyleWrappedComponent {...props} className={this.classNameList.join(' ')}>
                    {this.props.children}
                </StyleWrappedComponent>
            )
        }
    }

    return hoistStatics(ImportStyle, StyleWrappedComponent)
}

export const ImportStyleRoot = () => (StyleWrappedComponent) => {

    class ImportStyleRoot extends Component {

        constructor (props) {
            super(props)

            // this.styleKeyList = []
            // this.styleList = {}
            this.styleMap = {}
            // this.styleCounter = {}

            this.checkAndWriteStyleToHeadTag = () => {
                for( let key in this.styleMap){
                    let styleObj = this.styleMap[key]
                    if(styleObj.ref > 0){
                        // 配置样式
                        if(!document.getElementById(key)){
                            let styleTag = document.createElement('style').innerHTML(styleObj.css)
                            document.getElementsByTagName('head')[0].append(styleTag)
                        }
                    } else {
                        // 移除样式
                        if(document.getElementById(key)){
                            document.getElementById(key).remove()
                        }
                    }
                }
            }
        }


        static childContextTypes = {
            appendStyle: React.PropTypes.func,
            removeStyle: React.PropTypes.func,
            getStyle: React.PropTypes.func
        }

        getChildContext = function () {
            return {
                appendStyle: (styles) => {
                    styles.forEach((style) => {
                        
                        if(!this.styleMap[style.wrapper]){
                            this.styleMap[style.wrapper] = {
                                css: style.css,
                                ref: 1
                            }
                        }else{
                            // 样式引用计数
                            this.styleMap[style.wrapper].ref ++
                        }
                    })

                    __CLIENT__ && this.checkAndWriteStyleToHeadTag()
                },
                removeStyle: (styles) => {
                    styles.forEach((style) => {
                        
                        // 引用计数减少
                        if(this.styleMap[style.wrapper]){
                            this.styleMap[style.wrapper].ref --
                        }

                    })
                },
                getStyle: () => {
                    return this.styleMap
                }
            }
        }

        render () {
            const props = {
                ...this.props,
                ...this.state
            }

            return (
                <StyleWrappedComponent {...props}>
                    {this.props.children}
                    { __SERVER__ && <StyleContainer />}
                </StyleWrappedComponent>
            )
        }
    }

    return ImportStyleRoot
}


// 统一处理，把string,object 都转化成array
const stylesHandleWapperCssLoader = (styles) => {

    // 如果是对象
    if (typeof styles === 'object' && !styles.length) {
        styles = [styles]
    }

    if (typeof styles === 'object' && styles.length) {
        return styles
    }

    throw 'stylesHandleWapperCssLoader() styles type must be array or object'
}
// Copyright (C) 2021  Shanhu Tech Inc.
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by the
// Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as React from 'react' // for tsx

import * as dagdata from './dagdata'

export class GridProp {
    xgrid: number
    ygrid: number
    boxWidth: number
    boxHeight: number
}

export interface BoxProp {
    node: dagdata.Node
    text: string
    hash: string
    onClick: { (): void }
    onHover: { (): void }
}

export class Node {
    grid: GridProp
    node: dagdata.Node
    hash: string

    inEdges: Edge[] = []
    outEdges: Edge[] = []
    inNodes: { [hash: string]: Node } = {}
    outNodes: { [hash: string]: Node } = {}

    inEdges2: Edge[] = []
    outEdges2: Edge[] = []
    inNodes2: { [hash: string]: Node } = {}
    outNodes2: { [hash: string]: Node } = {}

    text: string = ''

    xleft: number
    xright: number
    ymid: number
    ytop: number
    ybottom: number
    highlight: string = 'none'

    click: { (): void }
    hover: { (): void }

    constructor(grid: GridProp, box: BoxProp) {
        this.hash = box.hash
        this.grid = grid
        this.node = box.node
        this.text = box.text
        let node = box.node

        this.click = box.onClick
        this.hover = box.onHover

        this.xleft = node.x * grid.xgrid
        this.xright = this.xleft + grid.boxWidth
        this.ytop = node.y * grid.ygrid
        this.ybottom = this.ytop + grid.boxHeight
        this.ymid = this.ytop + grid.boxHeight / 2
    }

    addIn(e: Edge) { this.inEdges.push(e) }
    addOut(e: Edge) { this.outEdges.push(e) }

    populate() {
        for (let e of this.outEdges) {
            this.outNodes[e.hash] = e.to
            this.addOut2(e.to)
        }
        for (let e of this.inEdges) {
            this.inNodes[e.hash] = e.from
            this.addIn2(e.from)
        }
    }

    addIn2(node: Node) {
        for (let e of node.inEdges) {
            this.inEdges2.push(e)

            let from = e.from
            if (from.hash in this.inNodes) { continue }
            if (from.hash in this.inNodes2) { continue }
            this.inNodes2[from.hash] = from
            this.addIn2(from)
        }
    }

    addOut2(node: Node) {
        for (let e of node.outEdges) {
            this.outEdges2.push(e)

            let to = e.to
            if (to.hash in this.outNodes) { continue }
            if (to.hash in this.outNodes2) { continue }
            this.outNodes2[to.hash] = to
            this.addOut2(to)
        }
    }

    setFocus(b: boolean) {
        let highlight = (m: { [hash: string]: Node }, hl: string) => {
            for (let h in m) {
                m[h].highlight = hl
            }
        }

        let highlightEdges = (es: Edge[], hl: string) => {
            for (let e of es) {
                e.highlight = hl
            }
        }

        if (!b) {
            this.highlight = 'none'
            highlight(this.inNodes, 'none')
            highlight(this.inNodes2, 'none')
            highlight(this.outNodes, 'none')
            highlight(this.outNodes2, 'none')
            highlightEdges(this.inEdges, 'none')
            highlightEdges(this.inEdges2, 'none')
            highlightEdges(this.outEdges, 'none')
            highlightEdges(this.outEdges2, 'none')
        } else {
            this.highlight = 'focus'
            highlight(this.inNodes, 'in')
            highlight(this.inNodes2, 'in2')
            highlight(this.outNodes, 'out')
            highlight(this.outNodes2, 'out2')
            highlightEdges(this.inEdges, 'in')
            highlightEdges(this.inEdges2, 'in2')
            highlightEdges(this.outEdges, 'out')
            highlightEdges(this.outEdges2, 'out2')
        }
    }

    points(grid: GridProp): string {
        let t = 6
        let nin = this.inEdges.length
        let nout = this.outEdges.length
        let node = this.node

        var ret = ''
        let o = (x: number, y: number) => {
            ret += x + ',' + y + ' '
        }

        if (nin == 0) {
            o(this.xleft, this.ytop)
            o(this.xleft, this.ybottom)
        } else {
            o(this.xleft + t / 2, this.ytop)
            o(this.xleft - t / 2, this.ymid)
            o(this.xleft + t / 2, this.ybottom)
        }

        if (nout == 0) {
            o(this.xright, this.ybottom)
            o(this.xright, this.ytop)
        } else {
            o(this.xright - t / 2, this.ybottom)
            o(this.xright + t / 2, this.ymid)
            o(this.xright - t / 2, this.ytop)
        }

        return ret
    }

    render(): JSX.Element {
        let grid = this.grid
        let x = this.node.x * grid.xgrid + grid.boxWidth / 2
        let y = this.node.y * grid.ygrid + grid.boxHeight / 2 + 5

        let click = () => { this.click() }
        let hover = () => { this.hover() }

        let props = {
            points: this.points(grid),
            onClick: click,
            onMouseOver: hover,
            className: this.highlight,
        }

        return <g key={this.hash}>
            <polygon {...props} />
            <text x={x} y={y} onClick={click} onMouseOver={hover}>
                {this.text}
            </text>
        </g>
    }
}

export class Edge {
    hash: string
    from: Node
    to: Node
    highlight: string = 'none'

    constructor(from: Node, to: Node, hash: string) {
        this.from = from
        this.to = to
        this.hash = hash
    }

    path(): string {
        let fromx = this.from.xright
        let fromy = this.from.ymid
        let tox = this.to.xleft
        let toy = this.to.ymid
        let turnx = tox - 6

        var ret = ''
        ret += 'M' + fromx + ' ' + fromy
        ret += ' L' + turnx + ' ' + fromy
        ret += ' L' + turnx + ' ' + toy
        ret += ' L' + tox + ' ' + toy

        return ret
    }

    render(): JSX.Element {
        let props = {
            key: this.hash,
            d: this.path(),
            className: this.highlight,
        }
        return <path {...props} />
    }
}


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

import * as redraw from '@shanhuio/misc/dist/redraw'
import * as rand from '@shanhuio/misc/dist/rand'

import * as dagdata from './dagdata'
import * as dagbox from './dagbox'

export interface Prop {
    click: { (node: string): void }
    textWidth?: { (s: string): number }
}

function nodeText(name: string, n: dagdata.Node): string {
    if (n.n) return n.n
    return name
}

function getBoxWidth(g: dagdata.Graph, p: Prop): number {
    if (!p.textWidth) { return 100 }
    var ret = 70
    for (let name in g.n) {
        let node = g.n[name]
        let text = nodeText(name, node)
        let w = p.textWidth(text) + 14
        if (w > ret) {
            ret = w
        }
    }

    return ret
}

export class Dag {
    graph: dagdata.Graph
    redraw: redraw.Redraw
    prefix: string = rand.ID(6)
    nodes: { [key: string]: dagbox.Node } = {}
    edges: dagbox.Edge[] = []
    grid: dagbox.GridProp
    width: number
    height: number
    focus: string = ''
    click: { (node: string): void }

    constructor(r: redraw.Redraw, g: dagdata.Graph, prop: Prop) {
        let boxWidth = getBoxWidth(g, prop)
        let boxHeight = 22

        this.redraw = r
        this.graph = g
        this.grid = {
            ygrid: (boxHeight + 10) / 2,
            xgrid: boxWidth + 12,
            boxHeight: boxHeight,
            boxWidth: boxWidth,
        }
        this.click = prop.click

        for (let name in g.n) {
            let node = g.n[name]
            let hash = btoa(this.prefix + ':node:' + name)
            let n = new dagbox.Node(this.grid, {
                node: node,
                text: nodeText(name, node),
                hash: hash,
                onClick: () => { this.click(name) },
                onHover: () => { this.setFocus(name) },
            })
            this.nodes[name] = n
        }

        for (let name in g.n) {
            let node = g.n[name]
            let fromNode = this.nodes[name]
            if (!node.o) { continue }
            for (let out of node.o) {
                let toNode = this.nodes[out]
                let s = this.prefix + ':edge:' + name + ':' + out
                let hash = btoa(s)
                let edge = new dagbox.Edge(fromNode, toNode, hash)

                fromNode.addOut(edge)
                toNode.addIn(edge)
                this.edges.push(edge)
            }
        }

        for (let name in this.nodes) {
            this.nodes[name].populate()
        }

        this.width = g.w * this.grid.xgrid - 10
        this.height = (g.h + 1) * this.grid.ygrid - 7
    }

    setFocus(node: string) {
        if (this.focus === node) { return }

        if (this.focus != '') {
            this.nodes[this.focus].setFocus(false)
        }

        this.nodes[node].setFocus(true)
        this.focus = node
        this.redraw()
    }

    render() {
        let nodes: JSX.Element[] = []
        for (let name in this.nodes) {
            nodes.push(this.nodes[name].render())
        }

        let edges: { [k: string]: dagbox.Edge[] } = {
            'in': [],
            'out': [],
            'in2': [],
            'out2': [],
            'none': [],
        }

        for (let e of this.edges) {
            edges[e.highlight].push(e)
        }

        let renderEdges = (hl: string) => {
            let es = edges[hl]
            return es.map((e: dagbox.Edge) => { return e.render() })
        }

        return <div className="dagbox">
            <svg className="dag" width={this.width} height={this.height}>
                {renderEdges('none')}
                {renderEdges('in2')}
                {renderEdges('out2')}
                {renderEdges('in')}
                {renderEdges('out')}
                {nodes}
            </svg>
        </div>
    }
}

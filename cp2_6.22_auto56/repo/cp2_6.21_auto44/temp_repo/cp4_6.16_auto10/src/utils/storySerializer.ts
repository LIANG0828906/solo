import type { Story, ChartConfig } from '../types';
import { createChart } from './chartRenderer';

const STORY_STORAGE_KEY = 'datastory_stories';

const D3_CORE_FALLBACK = `
(function() {
  window.__d3Fallback = {
    loaded: false,
    version: '7.0.0-fallback'
  };

  function createLinearScale() {
    var domain = [0, 1];
    var range = [0, 1];
    
    function scale(x) {
      var t = (x - domain[0]) / (domain[1] - domain[0]);
      return range[0] + t * (range[1] - range[0]);
    }
    
    scale.domain = function(d) {
      if (!arguments.length) return domain.slice();
      domain = d.slice();
      return scale;
    };
    
    scale.range = function(r) {
      if (!arguments.length) return range.slice();
      range = r.slice();
      return scale;
    };
    
    scale.nice = function() {
      var extent = [domain[0], domain[1]];
      var span = extent[1] - extent[0];
      if (span === 0) span = 1;
      var power = Math.floor(Math.log10(span));
      var magnitude = Math.pow(10, power);
      var normalized = span / magnitude;
      var niceNormalized = normalized <= 1.5 ? 2 : normalized <= 3 ? 5 : 10;
      var niceSpan = niceNormalized * magnitude;
      domain[0] = Math.floor(extent[0] / niceSpan) * niceSpan;
      domain[1] = Math.ceil(extent[1] / niceSpan) * niceSpan;
      return scale;
    };
    
    scale.invert = function(y) {
      var t = (y - range[0]) / (range[1] - range[0]);
      return domain[0] + t * (domain[1] - domain[0]);
    };
    
    return scale;
  }

  function createBandScale() {
    var domain = [];
    var range = [0, 1];
    var padding = 0;
    
    function scale(d) {
      var i = domain.indexOf(String(d));
      if (i < 0) return undefined;
      var step = (range[1] - range[0]) / (domain.length + padding * (domain.length + 1));
      var bandwidth = step * (1 - padding);
      return range[0] + step * (i + padding) + (step - bandwidth) / 2;
    }
    
    scale.domain = function(d) {
      if (!arguments.length) return domain.slice();
      domain = d.map(String);
      return scale;
    };
    
    scale.range = function(r) {
      if (!arguments.length) return range.slice();
      range = r.slice();
      return scale;
    };
    
    scale.rangeRound = function(r) {
      range = r.map(Math.round);
      return scale;
    };
    
    scale.padding = function(p) {
      if (!arguments.length) return padding;
      padding = Math.max(0, Math.min(1, p));
      return scale;
    };
    
    scale.bandwidth = function() {
      var step = (range[1] - range[0]) / (domain.length + padding * (domain.length + 1));
      return step * (1 - padding);
    };
    
    scale.step = function() {
      return (range[1] - range[0]) / (domain.length + padding * (domain.length + 1));
    };
    
    return scale;
  }

  function createOrdinalScale() {
    var domain = [];
    var range = [];
    var unknown;
    
    function scale(d) {
      var i = domain.indexOf(d);
      if (i < 0) return unknown;
      return range[i % range.length];
    }
    
    scale.domain = function(d) {
      if (!arguments.length) return domain.slice();
      domain = d.slice();
      return scale;
    };
    
    scale.range = function(r) {
      if (!arguments.length) return range.slice();
      range = r.slice();
      return scale;
    };
    
    scale.unknown = function(u) {
      if (!arguments.length) return unknown;
      unknown = u;
      return scale;
    };
    
    return scale;
  }

  function max(array, accessor) {
    if (!array || !array.length) return undefined;
    var values = accessor ? array.map(accessor) : array;
    return Math.max.apply(null, values);
  }

  function sum(array, accessor) {
    if (!array || !array.length) return 0;
    var values = accessor ? array.map(accessor) : array;
    return values.reduce(function(a, b) { return a + b; }, 0);
  }

  function range(start, end, step) {
    if (arguments.length < 2) {
      end = start;
      start = 0;
    }
    if (arguments.length < 3) step = 1;
    var result = [];
    for (var i = 0; i < end; i++) {
      result.push(start + i * step);
    }
    return result;
  }

  function select(selector) {
    var node = typeof selector === 'string' ? document.querySelector(selector) : selector;
    return createSelection(node ? [node] : []);
  }

  function selectAll(selector) {
    var nodes = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
    return createSelection(Array.prototype.slice.call(nodes));
  }

  function createSelection(nodes) {
    var selection = {
      _groups: [nodes],
      _parents: [document],
      
      select: function(selector) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            var found = nodes[i].querySelector(selector);
            result.push(found);
          }
        }
        return createSelection(result);
      },
      
      selectAll: function(selector) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            var found = nodes[i].querySelectorAll(selector);
            for (var j = 0; j < found.length; j++) {
              result.push(found[j]);
            }
          }
        }
        return createSelection(result);
      },
      
      append: function(name) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            var el = document.createElementNS(
              name === 'svg' || name === 'g' || name === 'path' || name === 'text' || 
              name === 'line' || name === 'circle' || name === 'rect' || 
              name === 'defs' || name === 'linearGradient' || name === 'stop' ||
              name === 'radialGradient'
                ? 'http://www.w3.org/2000/svg' 
                : 'http://www.w3.org/1999/xhtml',
              name
            );
            nodes[i].appendChild(el);
            result.push(el);
          }
        }
        return createSelection(result);
      },
      
      attr: function(name, value) {
        if (typeof value === 'function') {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].setAttribute(name, value(nodes[i].__data__, i));
            }
          }
        } else if (value !== undefined) {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].setAttribute(name, value);
            }
          }
        } else if (nodes.length > 0 && nodes[0]) {
          return nodes[0].getAttribute(name);
        }
        return selection;
      },
      
      style: function(name, value) {
        if (typeof value === 'function') {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].style[name] = value(nodes[i].__data__, i);
            }
          }
        } else {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].style[name] = value;
            }
          }
        }
        return selection;
      },
      
      text: function(value) {
        if (typeof value === 'function') {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].textContent = value(nodes[i].__data__, i);
            }
          }
        } else if (value !== undefined) {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]) {
              nodes[i].textContent = value;
            }
          }
        } else if (nodes.length > 0 && nodes[0]) {
          return nodes[0].textContent;
        }
        return selection;
      },
      
      html: function(value) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            nodes[i].innerHTML = value;
          }
        }
        return selection;
      },
      
      property: function(name, value) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            nodes[i][name] = value;
          }
        }
        return selection;
      },
      
      classed: function(name, value) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            if (value) {
              nodes[i].classList.add(name);
            } else {
              nodes[i].classList.remove(name);
            }
          }
        }
        return selection;
      },
      
      data: function(values) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            nodes[i].__data__ = values[i];
            result.push(nodes[i]);
          }
        }
        var updateSel = createSelection(result);
        updateSel._enter = values.slice(nodes.length).map(function(d, i) {
          return { __data__: d, __index__: nodes.length + i };
        });
        updateSel._update = result;
        return updateSel;
      },
      
      datum: function(value) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            nodes[i].__data__ = value;
          }
        }
        return selection;
      },
      
      enter: function() {
        var enterNodes = selection._enter || [];
        var result = enterNodes.map(function(d) {
          var placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          placeholder.__data__ = d.__data__;
          return placeholder;
        });
        return createSelection(result);
      },
      
      exit: function() {
        return createSelection([]);
      },
      
      merge: function(other) {
        var combined = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) combined.push(nodes[i]);
        }
        if (other._groups) {
          for (var i = 0; i < other._groups[0].length; i++) {
            if (other._groups[0][i]) combined.push(other._groups[0][i]);
          }
        }
        return createSelection(combined);
      },
      
      transition: function() {
        return {
          duration: function() { return this; },
          delay: function() { return this; },
          ease: function() { return this; },
          attr: function(name, value) {
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i]) {
                setTimeout(function(node, n, v) {
                  node.setAttribute(n, typeof v === 'function' ? v(node.__data__) : v);
                }, 0, nodes[i], name, value);
              }
            }
            return this;
          },
          style: function(name, value) {
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i]) {
                setTimeout(function(node, n, v) {
                  node.style[n] = v;
                }, 0, nodes[i], name, value);
              }
            }
            return this;
          },
          on: function() { return this; }
        };
      },
      
      on: function(event, handler) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            (function(node, idx) {
              node.addEventListener(event, function(e) {
                handler.call(node, e, node.__data__, idx);
              });
            })(nodes[i], i);
          }
        }
        return selection;
      },
      
      call: function(fn) {
        fn(selection);
        return selection;
      },
      
      remove: function() {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] && nodes[i].parentNode) {
            nodes[i].parentNode.removeChild(nodes[i]);
          }
        }
        return selection;
      },
      
      empty: function() {
        return nodes.length === 0 || !nodes.some(function(n) { return n; });
      },
      
      size: function() {
        return nodes.filter(function(n) { return n; }).length;
      },
      
      nodes: function() {
        return nodes.filter(function(n) { return n; });
      },
      
      node: function() {
        return nodes.find(function(n) { return n; }) || null;
      },
      
      each: function(fn) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i]) {
            fn.call(nodes[i], nodes[i].__data__, i, nodes);
          }
        }
        return selection;
      },
      
      filter: function(fn) {
        var filtered = [];
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] && fn.call(nodes[i], nodes[i].__data__, i)) {
            filtered.push(nodes[i]);
          }
        }
        return createSelection(filtered);
      }
    };
    
    return selection;
  }

  function line() {
    var x = function(d) { return d[0]; };
    var y = function(d) { return d[1]; };
    var curve = null;
    
    function line(data) {
      if (!data || !data.length) return '';
      var path = '';
      for (var i = 0; i < data.length; i++) {
        var px = x(data[i], i, data);
        var py = y(data[i], i, data);
        if (curve && curve === curveMonotoneX && i > 0) {
          var prevX = x(data[i-1], i-1, data);
          var prevY = y(data[i-1], i-1, data);
          var cpx = (prevX + px) / 2;
          path += ' C ' + cpx + ',' + prevY + ' ' + cpx + ',' + py + ' ' + px + ',' + py;
        } else if (i === 0) {
          path += 'M ' + px + ',' + py;
        } else {
          path += ' L ' + px + ',' + py;
        }
      }
      return path;
    }
    
    line.x = function(fn) {
      if (!arguments.length) return x;
      x = fn;
      return line;
    };
    
    line.y = function(fn) {
      if (!arguments.length) return y;
      y = fn;
      return line;
    };
    
    line.curve = function(c) {
      if (!arguments.length) return curve;
      curve = c;
      return line;
    };
    
    return line;
  }

  function area() {
    var x = function(d) { return d[0]; };
    var y0 = function() { return 0; };
    var y1 = function(d) { return d[1]; };
    var curve = null;
    
    function area(data) {
      if (!data || !data.length) return '';
      var topPath = '';
      var bottomPath = '';
      
      for (var i = 0; i < data.length; i++) {
        var px = x(data[i], i, data);
        var py = y1(data[i], i, data);
        if (i === 0) {
          topPath += 'M ' + px + ',' + py;
        } else {
          topPath += ' L ' + px + ',' + py;
        }
      }
      
      for (var i = data.length - 1; i >= 0; i--) {
        var px = x(data[i], i, data);
        var py = y0(data[i], i, data);
        if (i === data.length - 1) {
          bottomPath += ' L ' + px + ',' + py;
        } else {
          bottomPath += ' L ' + px + ',' + py;
        }
      }
      
      return topPath + bottomPath + ' Z';
    }
    
    area.x = function(fn) {
      if (!arguments.length) return x;
      x = fn;
      return area;
    };
    
    area.y0 = function(fn) {
      if (!arguments.length) return y0;
      y0 = fn;
      return area;
    };
    
    area.y1 = function(fn) {
      if (!arguments.length) return y1;
      y1 = fn;
      return area;
    };
    
    area.curve = function(c) {
      if (!arguments.length) return curve;
      curve = c;
      return area;
    };
    
    return area;
  }

  function curveMonotoneX(ctx) {
    return ctx;
  }

  function axisBottom(scale) {
    return function(g) {
      var domain = scale.domain();
      var range = scale.range();
      var ticks = domain;
      var tickFormat = function(d) { return d; };
      
      var group = g._groups[0][0];
      if (!group) return;
      
      for (var i = 0; i < ticks.length; i++) {
        var xPos = scale(ticks[i]);
        
        var tick = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tick.setAttribute('class', 'tick');
        tick.setAttribute('transform', 'translate(' + xPos + ',0)');
        
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('y2', '6');
        tick.appendChild(line);
        
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '20');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = tickFormat(ticks[i]);
        tick.appendChild(text);
        
        group.appendChild(tick);
      }
      
      var domainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      domainPath.setAttribute('class', 'domain');
      domainPath.setAttribute('d', 'M' + range[0] + ',0.5H' + range[1]);
      group.appendChild(domainPath);
    };
  }

  function axisLeft(scale) {
    return function(g) {
      var domain = scale.domain();
      var range = scale.range();
      var ticks = 5;
      var tickValues = [];
      
      for (var i = 0; i <= ticks; i++) {
        tickValues.push(domain[0] + (domain[1] - domain[0]) * (i / ticks));
      }
      
      var tickFormat = function(d) { return Math.round(d * 10) / 10; };
      
      var group = g._groups[0][0];
      if (!group) return;
      
      for (var i = 0; i < tickValues.length; i++) {
        var yPos = scale(tickValues[i]);
        
        var tick = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tick.setAttribute('class', 'tick');
        tick.setAttribute('transform', 'translate(0,' + yPos + ')');
        
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x2', '-6');
        tick.appendChild(line);
        
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '-9');
        text.setAttribute('dy', '.32em');
        text.setAttribute('text-anchor', 'end');
        text.textContent = tickFormat(tickValues[i]);
        tick.appendChild(text);
        
        group.appendChild(tick);
      }
      
      var domainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      domainPath.setAttribute('class', 'domain');
      domainPath.setAttribute('d', 'M0.5,' + range[0] + 'V' + range[1]);
      group.appendChild(domainPath);
    };
  }

  function pie() {
    var value = function(d) { return d; };
    var sort = null;
    var startAngle = 0;
    var endAngle = 2 * Math.PI;
    
    function pie(data) {
      var values = data.map(value);
      var total = values.reduce(function(a, b) { return a + b; }, 0);
      var currentAngle = startAngle;
      
      return data.map(function(d, i) {
        var v = values[i];
        var angle = (v / total) * (endAngle - startAngle);
        var arc = {
          data: d,
          value: v,
          index: i,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
          padAngle: 0
        };
        currentAngle += angle;
        return arc;
      });
    }
    
    pie.value = function(fn) {
      if (!arguments.length) return value;
      value = fn;
      return pie;
    };
    
    pie.sort = function(fn) {
      if (!arguments.length) return sort;
      sort = fn;
      return pie;
    };
    
    pie.startAngle = function(a) {
      if (!arguments.length) return startAngle;
      startAngle = a;
      return pie;
    };
    
    pie.endAngle = function(a) {
      if (!arguments.length) return endAngle;
      endAngle = a;
      return pie;
    };
    
    return pie;
  }

  function arc() {
    var innerRadius = 0;
    var outerRadius = 100;
    var padAngle = 0;
    
    function arc(d) {
      var r0 = typeof innerRadius === 'function' ? innerRadius(d) : innerRadius;
      var r1 = typeof outerRadius === 'function' ? outerRadius(d) : outerRadius;
      var a0 = d.startAngle - Math.PI / 2;
      var a1 = d.endAngle - Math.PI / 2;
      
      var largeArcFlag = a1 - a0 > Math.PI ? 1 : 0;
      
      var x0 = r0 * Math.cos(a0);
      var y0 = r0 * Math.sin(a0);
      var x1 = r1 * Math.cos(a0);
      var y1 = r1 * Math.sin(a0);
      var x2 = r1 * Math.cos(a1);
      var y2 = r1 * Math.sin(a1);
      var x3 = r0 * Math.cos(a1);
      var y3 = r0 * Math.sin(a1);
      
      if (r0 === 0) {
        return 'M' + x1 + ',' + y1 +
               ' A' + r1 + ',' + r1 + ' 0 ' + largeArcFlag + ',1 ' + x2 + ',' + y2 +
               ' L0,0 Z';
      }
      
      return 'M' + x1 + ',' + y1 +
             ' A' + r1 + ',' + r1 + ' 0 ' + largeArcFlag + ',1 ' + x2 + ',' + y2 +
             ' L' + x3 + ',' + y3 +
             ' A' + r0 + ',' + r0 + ' 0 ' + largeArcFlag + ',0 ' + x0 + ',' + y0 +
             ' Z';
    }
    
    arc.innerRadius = function(r) {
      if (!arguments.length) return innerRadius;
      innerRadius = r;
      return arc;
    };
    
    arc.outerRadius = function(r) {
      if (!arguments.length) return outerRadius;
      outerRadius = r;
      return arc;
    };
    
    arc.centroid = function(d) {
      var r0 = typeof innerRadius === 'function' ? innerRadius(d) : innerRadius;
      var r1 = typeof outerRadius === 'function' ? outerRadius(d) : outerRadius;
      var r = (r0 + r1) / 2;
      var a = (d.startAngle + d.endAngle) / 2 - Math.PI / 2;
      return [r * Math.cos(a), r * Math.sin(a)];
    };
    
    return arc;
  }

  function format(specifier) {
    return function(value) {
      if (specifier === ',') {
        return value.toLocaleString();
      }
      var match = specifier.match(/\\.(\\d+)f/);
      if (match) {
        return value.toFixed(parseInt(match[1]));
      }
      return String(value);
    };
  }

  window.d3 = {
    select: select,
    selectAll: selectAll,
    scaleLinear: createLinearScale,
    scaleBand: createBandScale,
    scaleOrdinal: createOrdinalScale,
    max: max,
    sum: sum,
    range: range,
    line: line,
    area: area,
    curveMonotoneX: curveMonotoneX,
    axisBottom: axisBottom,
    axisLeft: axisLeft,
    pie: pie,
    arc: arc,
    format: format,
    transition: function() {
      return {
        duration: function() { return this; },
        delay: function() { return this; },
        ease: function() { return this; }
      };
    }
  };

  window.__d3Fallback.loaded = true;
  console.log('[D3 Fallback] Using embedded D3 core library (limited functionality)');
})();
`;

export function serializeStory(story: Story): string {
  return JSON.stringify(story, null, 2);
}

export function deserializeStory(json: string): Story {
  try {
    return JSON.parse(json) as Story;
  } catch (e) {
    throw new Error('Invalid story JSON format');
  }
}

export function exportHTML(story: Story): string {
  const serializedData = serializeStory(story);
  const chartRendererCode = createChart.toString();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title}</title>
  <script src="https://d3js.org/d3.v7.min.js" onerror="window.__d3LoadFailed = true;"></script>
  <script>
    ${D3_CORE_FALLBACK}
  </script>
  <script>
    window.__d3LoadFailed = false;
    window.addEventListener('load', function() {
      if (typeof d3 === 'undefined' || !d3.select || window.__d3LoadFailed) {
        console.warn('[D3] CDN load failed, using fallback...');
        var script = document.getElementById('d3-fallback-script');
        if (script && !window.__d3Fallback.loaded) {
          eval(script.textContent);
        }
        document.getElementById('d3-warning').style.display = 'block';
      }
    });
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #fff;
      overflow: hidden;
      height: 100vh;
    }
    .d3-warning {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #FF6B35, #F7C59F);
      color: #fff;
      padding: 8px 16px;
      text-align: center;
      font-size: 13px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .d3-warning strong {
      margin-right: 8px;
    }
    .play-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    .slide {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 40px 60px;
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
      transform: translateX(100%);
    }
    .slide.active {
      opacity: 1;
      transform: translateX(0);
    }
    .slide.prev {
      transform: translateX(-100%);
    }
    .slide-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #fff;
    }
    .chart-container {
      flex: 1;
      min-height: 400px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .notes-container {
      margin-top: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      max-height: 150px;
      overflow-y: auto;
    }
    .notes-container h1, .notes-container h2, .notes-container h3 {
      margin-bottom: 10px;
      color: #FF6B35;
    }
    .notes-container p {
      line-height: 1.6;
      color: #ccc;
    }
    .controls {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      align-items: center;
      z-index: 100;
    }
    .btn {
      padding: 12px 24px;
      background: #1A659E;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: #004E89;
      transform: translateY(-2px);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .progress-container {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FF6B35, #F7C59F);
      transition: width 0.3s ease;
    }
    .slide-counter {
      font-size: 14px;
      color: #888;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal {
      background: #2a2a4a;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .modal h3 {
      color: #FF6B35;
      margin-bottom: 15px;
      font-size: 24px;
    }
    .modal p {
      color: #ccc;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .modal img {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .slide {
        padding: 20px;
      }
      .slide-title {
        font-size: 24px;
      }
      .controls {
        bottom: 15px;
      }
      .btn {
        padding: 10px 16px;
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="d3-warning" id="d3-warning">
    <strong>⚠️ 提示：</strong>D3 图表库从 CDN 加载失败，已使用备用版本。部分高级动画效果可能受限。建议检查网络连接后刷新。
  </div>
  
  <div class="play-container" id="playContainer"></div>
  <div class="controls">
    <button class="btn" id="prevBtn">上一页</button>
    <span class="slide-counter" id="slideCounter">1 / ${story.slides.length}</span>
    <button class="btn" id="nextBtn">下一页</button>
    <button class="btn" id="exitBtn">退出</button>
  </div>
  <div class="progress-container">
    <div class="progress-bar" id="progressBar"></div>
  </div>
  <div class="modal-overlay" id="modalOverlay">
    <button class="close-btn" id="closeModal">&times;</button>
    <div class="modal" id="modalContent"></div>
  </div>

  <script id="d3-fallback-script" type="text/fallback">
    ${D3_CORE_FALLBACK}
  </script>

  <script>
    (function() {
      function init() {
        if (typeof d3 === 'undefined' || !d3.select) {
          console.error('[D3] Not available, loading fallback...');
          var fallbackScript = document.getElementById('d3-fallback-script');
          if (fallbackScript) {
            eval(fallbackScript.textContent);
          }
          document.getElementById('d3-warning').style.display = 'block';
        }
        
        const storyData = ${serializedData};
        let currentSlideIndex = 0;
        let cleanupChart = null;

        const ${chartRendererCode}

        function renderSlide(index) {
          const container = document.getElementById('playContainer');
          const slide = storyData.slides[index];
          if (!slide) return;

          if (cleanupChart) {
            cleanupChart();
          }

          container.innerHTML = '';
          
          const slideEl = document.createElement('div');
          slideEl.className = 'slide active';
          slideEl.innerHTML = \`
            <h1 class="slide-title">\${slide.chartConfig.title}</h1>
            <div class="chart-container" id="chart-\${slide.id}"></div>
            <div class="notes-container" id="notes-\${slide.id}"></div>
          \`;
          container.appendChild(slideEl);

          const chartContainer = document.getElementById('chart-' + slide.id);
          setTimeout(() => {
            try {
              cleanupChart = createChart(chartContainer, slide.chartConfig, (dataIndex) => {
                const interaction = slide.interactions.find(i => i.dataIndex === dataIndex);
                if (interaction) {
                  showModal(interaction);
                }
              });
            } catch (e) {
              console.error('Chart render error:', e);
              chartContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">图表渲染失败</div>';
            }
          }, 100);

          const notesContainer = document.getElementById('notes-' + slide.id);
          if (slide.notes) {
            notesContainer.innerHTML = slide.notes
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/\\*\\*(.*)\\*\\*/gim, '<strong>$1</strong>')
              .replace(/\\*(.*)\\*/gim, '<em>$1</em>')
              .replace(/\\n/g, '<br>');
          }

          updateControls();
        }

        function updateControls() {
          document.getElementById('prevBtn').disabled = currentSlideIndex === 0;
          document.getElementById('nextBtn').disabled = currentSlideIndex === storyData.slides.length - 1;
          document.getElementById('slideCounter').textContent = 
            \`\${currentSlideIndex + 1} / \${storyData.slides.length}\`;
          
          const progress = ((currentSlideIndex + 1) / storyData.slides.length) * 100;
          document.getElementById('progressBar').style.width = progress + '%';
        }

        function showModal(interaction) {
          const overlay = document.getElementById('modalOverlay');
          const content = document.getElementById('modalContent');
          
          content.innerHTML = \`
            <h3>\${interaction.eventName}</h3>
            \${interaction.imageUrl ? '<img src="' + interaction.imageUrl + '" alt="Event Image">' : ''}
            <p>\${interaction.description}</p>
          \`;
          overlay.classList.add('active');
        }

        function closeModal() {
          document.getElementById('modalOverlay').classList.remove('active');
        }

        document.getElementById('prevBtn').addEventListener('click', () => {
          if (currentSlideIndex > 0) {
            currentSlideIndex--;
            renderSlide(currentSlideIndex);
          }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
          if (currentSlideIndex < storyData.slides.length - 1) {
            currentSlideIndex++;
            renderSlide(currentSlideIndex);
          }
        });

        document.getElementById('exitBtn').addEventListener('click', () => {
          window.close();
        });

        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
          if (e.target.id === 'modalOverlay') closeModal();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
            currentSlideIndex--;
            renderSlide(currentSlideIndex);
          } else if (e.key === 'ArrowRight' && currentSlideIndex < storyData.slides.length - 1) {
            currentSlideIndex++;
            renderSlide(currentSlideIndex);
          } else if (e.key === 'Escape') {
            closeModal();
          }
        });

        renderSlide(0);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;
}

export function generateShareLink(story: Story): string {
  try {
    const stories = getAllStoredStories();
    stories[story.id] = story;
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(stories));
    
    const baseUrl = window.location.origin + window.location.pathname;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}storyId=${story.id}`;
  } catch (e) {
    console.error('Failed to save story to localStorage:', e);
    throw new Error('Failed to generate share link');
  }
}

export function loadFromShareLink(storyId: string): Story | null {
  try {
    const stories = getAllStoredStories();
    const story = stories[storyId];
    return story || null;
  } catch (e) {
    console.error('Failed to load story from localStorage:', e);
    return null;
  }
}

function getAllStoredStories(): Record<string, Story> {
  try {
    const stored = localStorage.getItem(STORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

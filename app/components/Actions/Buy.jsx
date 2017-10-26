import React from 'react'

import { observer, inject } from 'mobx-react';
import ReactTable from 'react-table'
import classNames from 'classnames';

import { CoinPicker } from '../';

import * as Icon from 'react-cryptocoins';
import zoro from '../../static/zoro.svg';
import shuffle from '../../static/shuffle.svg';
import arrow from '../../static/arrow.svg';
import sell from '../../static/sell.svg';
import buy from '../../static/buy.svg';

const formatNumber = (str) => str;

const orderbookColumns = [
    {
        Header: 'Ask Price',
        accessor: 'price' // String-based value accessors!
    },
    {
        Header: 'Volume',
        accessor: 'maxvolume' // String-based value accessors!
    },
    {
        Header: 'UTXOs',
        accessor: 'numutxos' // String-based value accessors!
    }
];

@inject('app')
@observer
class Trade extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            privateTransaction: false,
            amountRel: 0,
            amountBase: 0,
            selected: 0,
            picker: false,
            rate: 0,
            flow: 'buy',
            showOrderbook: false,
            validation: `enter amount to continue`

        }
    }

    componentDidMount = () => {
        const self = this;
        self.resetForm();
    }

    pickRate = (info) => {
        this.setState({
            showOrderbook: false
        })

        this.updateRate(info.original.price, info.index)
    }

    togglePrivate = () => {
        this.setState({ privateTransaction: !this.state.privateTransaction })
    }

    getRate = () => {
        const { asks } = this.props.app.orderbook;
        if (asks.length > 0) {
            return asks[0].price;
        }

        return 0;
    }

    toggleOrderbook = (e) => {
        this.setState({ showOrderbook: !this.state.showOrderbook });
        e.stopPropagation()
    }

    resetForm = () => {
        // this.amountRelInput.focus();
        // this.amountRelInput.value = '';
        const { tradeRel, tradeBase } = this.props.app.portfolio;
        this.setState({ amountRel: 0, amountBase: 0, picker: false, rate: 0, orderBookMessage: `Fetching ${tradeBase.coin}/${tradeRel.coin} orderbook` })
        this.validation({});
    }


    componentWillReact = () => {
        const { tradeRel, tradeBase } = this.props.app.portfolio;

        if (this.state.rate === 0) {
            const rate = this.getRate();
            this.updateRate(rate);
        }

        this.setState({ orderBookMessage: `Fetching ${tradeBase.coin}/${tradeRel.coin} orderbook` });
    }

    trade = () => {
        const { trade, tradeRel, tradeBase } = this.props.app.portfolio;

        const params = {
            method: 'buy',
            base: tradeBase.coin,
            rel: tradeRel.coin,
            price: this.state.rate,
            relvolume: this.state.amountRel
        };

        trade(params);

        this.resetForm();
    }

    validation = ({ amountRel, rate }) => {
        let validation = false;
        const { tradeRel } = this.props.app.portfolio;


        const amount = amountRel != null ? amountRel : this.state.amountRel;
        const price = rate != null ? rate : this.state.rate;

        if (!price) {
            validation = `price is empty`;
        } else if (tradeRel.balance < amount) {
            validation = (<div className="validation"><span>not enough {tradeRel.coin}</span><small>(max {tradeRel.balance})</small></div>);
        } else if (!amount) {
            validation = `${tradeRel.coin} amount is empty`;
        }

        this.setState({ validation, amountBase: amount / price });
    }

    updateRate = (rate, selected = false) => {
        const parsed = formatNumber(rate);
        this.setState({ rate: parsed, selected });
        this.validation({ rate: parsed });
    }

    updateAmountRel = (amountRel) => {
        const parsed = formatNumber(amountRel);
        this.setState({ amountRel: parsed });
        this.validation({ amountRel: parsed });
    }

    privateIcon = () => (<span className="private-icon" dangerouslySetInnerHTML={{ __html: zoro }} />)
    sellIcon = () => (<div className="trade-sell-label">
      <span>Sell</span>
      <span className="private-icon" dangerouslySetInnerHTML={{ __html: sell }} />
    </div>)
    buyIcon = () => (<div className="trade-buy-label">
      <span>Buy</span>
      <span className="private-icon" dangerouslySetInnerHTML={{ __html: buy }} />
    </div>)

    togglePicker = (e, type) => {
        this.setState({ picker: this.state.picker ? false : type });
        e.stopPropagation();
    }

    toggleFlow = () => {
        this.setState({ flow: this.state.flow === 'buy' ? 'sell' : 'buy' })
    }

    closeSelects = () => { this.setState({ picker: false, showOrderbook: false }) }

    coinPicker = (type) => (<CoinPicker title={type === 'Base' ? 'Select a coin to buy' : 'Select a coin to sell'} type={type} onClose={() => this.resetForm()} />)

    render() {
        // portfolio
        const self = this;
        const { tradeBase, tradeRel } = this.props.app.portfolio;
        const { asks, bids } = this.props.app.orderbook;
        const orderbook = asks;

        return (
          <section className={`trade-action`}>
            <section className="trade-action-wrapper">

              <div className={`trade-amount`}>


                <section className="trade-amount_input">
                  <section className="trade-amount_input_price">
                    <span className="label">
                      <span className="label-title">Price</span>
                      <small>
                        <button className="link">Bid</button>
                        <button className="link">Ask</button>
                        <button className="link" onClick={(e) => this.toggleOrderbook(e)}>{ this.state.showOrderbook ? 'Hide' : 'View'} orderbook</button>
                      </small>
                    </span>
                    <div className="trade-amount_input-wrapper">
                      <input
                        name="form-price"
                        type="number"
                        min="0"
                        placeholder="0.00"
                        style={{ fontSize: 18 }}
                        value={this.state.rate}
                        onChange={(e) => this.updateRate(e.target.value)}
                      />
                      <div className={`${tradeRel.coin}`}>
                        { this.state.picker && this.coinPicker(this.state.picker) }
                        <button onClick={(e) => self.togglePicker(e, 'Rel')} className="trade-pair action small arrow-down coin-colorized">
                          <span><span className="trade-base-icon">{tradeRel.icon}</span> { tradeRel.name }</span>
                          <i dangerouslySetInnerHTML={{ __html: arrow }} />
                        </button>
                      </div>
                    </div>

                    { this.state.showOrderbook && <section className="trade-orderbook">
                      <ReactTable
                        className="-striped -highlight"
                        data={orderbook}
                        columns={orderbookColumns}
                        defaultSorted={[{ id: 'price' }]}
                        noDataText={this.state.orderBookMessage}
                        showPaginationBottom={false}
                        style={{ height: '280px' }}
                        getTrProps={(state, rowInfo) => ({
                            onClick: e => { self.pickRate(rowInfo) },
                            className: rowInfo && rowInfo.index === self.state.selected ? 'selected coin-colorized' : ''
                        })}
                      /> </section>}

                  </section>
                  <section className="trade-amount_input_amount">
                    <span className="label">
                      <span className="label-title">{`Amount of ${tradeRel.coin} to sell`}</span>
                    </span>
                    <div className="trade-amount_input-wrapper">
                      <input
                        name="form-amount"
                        type="number"
                        min="0"
                        placeholder="0.00"
                        style={{ fontSize: 18 }}
                        value={this.state.amountRel}
                        onChange={(e) => this.updateAmountRel(e.target.value)}
                      />
                      { this.state.amountRel < tradeRel.balance && <button className="trade-setMax" onClick={() => this.updateAmountRel(tradeRel.balance)}>Max</button> }
                    </div>

                  </section>
                </section>

              </div>


              <section className={`trade-button-wrapper ${tradeBase.coin}`}>
                <button className="trade-button withBorder action primary coin-bg" onClick={() => this.trade()} disabled={this.state.validation}>
                  <div className="trade-action-amountRel">
                    <small> { this.state.validation ? 'VALIDATION' : 'ORDER' }</small>
                    { this.state.validation ? this.state.validation : <span>{this.state.amountBase} {tradeBase.coin}</span> }
                  </div>
                  <i dangerouslySetInnerHTML={{ __html: shuffle }} />
                </button>
              </section>


            </section>

          </section>
        );
    }
}


export default Trade
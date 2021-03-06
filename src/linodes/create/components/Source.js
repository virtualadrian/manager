import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import moment from 'moment';

import { Card } from '~/components/cards';
import Tabs from '~/components/Tabs';
import Distributions from '~/linodes/components/Distributions';
import Backups from './Backups';

export default class Source extends Component {
  constructor() {
    super();
    this.state = { backupsPage: 0, backupsFilter: '', selectedLinode: -1 };
  }

  renderLinodeSelection() {
    const { linodes, perPageLimit } = this.props;
    const { backupsPage, backupsFilter } = this.state;
    const hasBackups = linode => (
      linode.backups && linode.backups.enabled && linode.label.indexOf(backupsFilter) !== -1
    );

    const linodesWithBackups = Object.values(_.filter(linodes.linodes, hasBackups));

    if (!linodesWithBackups.length) {
      return <section>No backups available.</section>;
    }

    const currentIndex = backupsPage * perPageLimit;
    const linodesOnPage = linodesWithBackups.slice(currentIndex, currentIndex + perPageLimit);

    const maxPage = Math.ceil(linodesWithBackups.length / perPageLimit) - 1;
    const gotoPage = page => e => {
      e.preventDefault();
      this.setState({ backupsPage: page });
    };
    const decreaseCount = gotoPage(Math.max(backupsPage - 1, 0));
    const increaseCount = gotoPage(Math.min(backupsPage + 1, maxPage));

    return (
      <div className="LinodeSelection-container">
        <div className="LinodeSelection-filter">
          <div className="filter">
            <input
              type="text"
              onChange={e =>
                this.setState({ backupsFilter: e.target.value, backupsPage: 0 })}
              value={backupsFilter}
              placeholder="Filter..."
              className="form-control"
            />
          </div>
        </div>

        <div className="LinodeSelection-table-container">
          <table>
            <thead>
              <tr>
                <td>Linode</td>
                <td>Last backup</td>
              </tr>
            </thead>
            <tbody>
            {_.map(linodesOnPage, l =>
              <tr key={l.created}>
                <td>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      this.setState({ selectedLinode: l.id });
                    }}
                  >{l.label}</a>
                </td>
                <td>{l.backups.last_backup ?
                  moment(l.backups.last_backup).format('dddd, MMMM D YYYY LT')
                  : 'Unknown'}</td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        {linodesWithBackups.length > perPageLimit ? (
          <nav className="text-xs-center">
            <ul className="pagination">
              <li className="page-item">
                <a href="#" aria-label="Previous" onClick={decreaseCount} className="page-link">
                  <span aria-hidden="true">&laquo;</span>
                </a>
              </li>
              {_.range(maxPage + 1).map(pageIndex =>
                <li className="page-item" key={pageIndex}>
                  <a href="#" onClick={gotoPage(pageIndex)} className="page-link">
                    {pageIndex + 1}
                  </a>
                </li>)}
              <li className="page-item">
                <a href="#" aria-label="Next" onClick={increaseCount} className="page-link">
                  <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>
          ) : null}
      </div>
    );
  }

  render() {
    const {
      selectedTab, onTabChange, distributions, distribution, onSourceSelected, backup,
      linodes,
    } = this.props;

    const { selectedLinode } = this.state;

    if (backup && selectedLinode === -1) {
      // Select a linode
      const linode = Object.values(linodes.linodes)
        .find(l => Object.values(l._backups.backups).find(b => b.id === backup));
      if (linode) {
        this.setState({ selectedLinode: linode.id });
      }
    }

    const tabs = [
      {
        name: 'Distributions',
        children: (
          <Distributions
            distributions={distributions}
            distribution={distribution}
            onSelected={d => onSourceSelected('distribution', d)}
          />
        ),
      },
      {
        name: 'Backups',
        children: (
          <div className="backups">
            {selectedLinode === -1 ?
             this.renderLinodeSelection() :
              <Backups
                goBack={e => {
                  e.preventDefault();
                  this.setState({ selectedLinode: -1 });
                  onSourceSelected('backup', null);
                }}
                onSourceSelected={id => onSourceSelected('backup', id, selectedLinode)}
                selectedLinode={selectedLinode}
                selected={backup}
              />}
          </div>
        ),
      },
      {
        name: 'Clone',
        children: 'TODO',
      },
      {
        name: 'StackScripts',
        children: 'TODO',
      },
    ];

    return (
      <Card title="Source">
        <Tabs
          tabs={tabs}
          onClick={onTabChange}
          selected={selectedTab}
          isSubTabs
        />
      </Card>
    );
  }
}

Source.propTypes = {
  distributions: PropTypes.object.isRequired,
  linodes: PropTypes.object.isRequired,
  selectedTab: PropTypes.number.isRequired,
  onTabChange: PropTypes.func,
  onSourceSelected: PropTypes.func,
  distribution: PropTypes.string,
  backup: PropTypes.number,
  perPageLimit: PropTypes.number,
};

Source.defaultProps = {
  onTabChange: () => {},
  onSourceSelected: () => {},
  perPageLimit: 20,
};

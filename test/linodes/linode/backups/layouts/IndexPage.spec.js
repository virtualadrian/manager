import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { expectRequest, expectObjectDeepEquals } from '@/common';
import { api } from '@/data';
import { IndexPage } from '~/linodes/linode/backups/layouts/IndexPage';

describe('linodes/linode/backups/layouts/IndexPage', () => {
  const sandbox = sinon.sandbox.create();
  const dispatch = sandbox.spy();

  afterEach(() => {
    dispatch.reset();
    sandbox.restore();
  });

  it('renders tabs with correct names and links with backups enabled', () => {
    const page = mount(
      <IndexPage
        dispatch={dispatch}
        linodes={api.linodes}
        params={{ linodeLabel: 'test-linode' }}
      />
    );

    const tabList = [
      { name: 'Summary', link: '/' },
      { name: 'Settings', link: '/settings' },
    ].map(t => ({ ...t, link: `/linodes/test-linode/backups${t.link}` }));

    const tabs = page.find('Tabs').find('Tab');
    expect(tabs.length).to.equal(tabList.length);
    tabList.forEach(({ name, link }, i) => {
      expect(tabs.at(i).children().text()).to.equal(name);
    });
  });

  it('renders enable backup page when backups are disabled', async () => {
    const page = mount(
      <IndexPage
        dispatch={dispatch}
        linodes={api.linodes}
        params={{ linodeLabel: 'test-linode-1' }}
      />
    );

    expect(page.find('Tabs').length).to.equal(0);

    const form = page.find('form');
    expect(form.text()).to.contain('$2.50');

    const button = form.find('button');
    expect(button.length).to.equal(1);
    dispatch.reset();
    form.simulate('submit');

    const fn = dispatch.firstCall.args[0];
    await expectRequest(fn, '/linode/instances/1235/backups/enable');
  });

  it('renders errors when enable backups fails', async () => {
    const errorDispatch = sandbox.stub();

    const page = await mount(
      <IndexPage
        dispatch={errorDispatch}
        linodes={api.linodes}
        params={{ linodeLabel: 'test-linode-1' }}
      />
    );

    errorDispatch.reset();
    errorDispatch.throws({
      json: () => ({ errors: [{ reason: 'Nooo!' }] }),
    });
    await page.instance().enableBackups({ preventDefault() {} });

    expectObjectDeepEquals(page.instance().state.errors, {
      _: [{ reason: 'Nooo!' }],
    });
  });
});

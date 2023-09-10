//
// Copyright (c) 2022-2023 Winlin
//
// SPDX-License-Identifier: AGPL-3.0-or-later
//
import {useSearchParams} from "react-router-dom";
import {Container, Tabs, Tab} from "react-bootstrap";
import React from "react";
import {Clipboard, Token} from "../utils";
import axios from "axios";
import ScenarioLive from './ScenarioLive';
import useUrls from "../components/UrlGenerator";
import ScenarioForward from './ScenarioForward';
import {useErrorHandler} from 'react-error-boundary';
import {SrsErrorBoundary} from "../components/SrsErrorBoundary";
import ScenarioTutorials from './ScenarioTutorials';
import {useTranslation} from "react-i18next";
import {useSrsLanguage} from "../components/LanguageSwitch";
import ScenarioRecord from "./ScenarioRecord";
import ScenarioVLive from "./ScenarioVLive";
import {ScenarioVxOthers} from "./ScenarioOthers";

export default function Scenario() {
  const [searchParams] = useSearchParams();
  const [defaultActiveTab, setDefaultActiveTab] = React.useState();
  const language = useSrsLanguage();

  React.useEffect(() => {
    const tab = searchParams.get('tab') || 'tutorials';
    console.log(`?tab=tutorials|live|rgroup|vgroup|ogroup, current=${tab}, Select the tab to render`);
    setDefaultActiveTab(tab);
  }, [searchParams, language]);

  return (
    <SrsErrorBoundary>
      { defaultActiveTab && <ScenarioImpl {...{defaultActiveTab}} /> }
    </SrsErrorBoundary>
  );
}

function ScenarioImpl({defaultActiveTab}) {
  const [secret, setSecret] = React.useState();
  const [streamName, setStreamName] = React.useState('livestream');
  const [activeTab, setActiveTab] = React.useState(defaultActiveTab);
  const setSearchParams = useSearchParams()[1];
  const handleError = useErrorHandler();
  const urls = useUrls({secret, streamName});
  const {t} = useTranslation();

  React.useEffect(() => {
    const token = Token.load();
    axios.post('/terraform/v1/hooks/srs/secret/query', {
      ...token,
    }).then(res => {
      setSecret(res.data.data);
      console.log(`Status: Query ok, secret=${JSON.stringify(res.data.data)}`);
    }).catch(handleError);
  }, [handleError]);

  const onSelectTab = React.useCallback((k) => {
    setSearchParams({'tab': k});
    setActiveTab(k);
  }, [setSearchParams]);

  const updateStreamName = React.useCallback(() => {
    setStreamName(Math.random().toString(16).slice(-6).split('').map(e => {
      return (e >= '0' && e <= '9') ? String.fromCharCode('a'.charCodeAt(0) + (parseInt(Math.random() * 16 + e) % 25)) : e;
    }).join(''));
    alert(t('helper.changeStream'));
  }, [t]);

  const copyToClipboard = React.useCallback((e, text) => {
    e.preventDefault();

    Clipboard.copy(text).then(() => {
      alert(t('helper.copyOk'));
    }).catch((err) => {
      alert(`${t('helper.copyFail')} ${err}`);
    });
  }, [t]);

  return (
    <>
      <p></p>
      <Container>
        <Tabs defaultActiveKey={activeTab} id="tab0" className="mb-3" onSelect={(k) => onSelectTab(k)}>
          <Tab eventKey="tutorials" title={t('scenario.tutorials')}>
            {activeTab === 'tutorials' && <ScenarioTutorials/>}
          </Tab>
          <Tab eventKey="live" title={t('scenario.live')}>
            {activeTab === 'live' && <ScenarioLive {...{updateStreamName, copyToClipboard, urls}} />}
          </Tab>
          <Tab eventKey="forward" title={t('scenario.forward')}>
            {activeTab === 'forward' && <ScenarioForward/>}
          </Tab>
          <Tab eventKey="rgroup" title={t('scenario.rgroup')}>
            {activeTab === 'rgroup' && <ScenarioRecord/>}
          </Tab>
          <Tab eventKey="vgroup" title={t('scenario.vgroup')}>
            {activeTab === 'vgroup' && <ScenarioVLive/>}
          </Tab>
          <Tab eventKey="transcode" title={t('scenario.transcode')}>
            {activeTab === 'transcode' && <ScenarioTranscode/>}
          </Tab>
          <Tab eventKey="ogroup" title={t('scenario.ogroup')}>
            {activeTab === 'ogroup' && <ScenarioVxOthers/>}
          </Tab>
        </Tabs>
      </Container>
    </>
  );
}

function ScenarioTranscode() {
  return (
    <span>On the way...</span>
  );
}


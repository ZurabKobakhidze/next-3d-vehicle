"use client";

import styled from "styled-components";

export default function WheelRepair() {
  return (
    <MainDiv>
      <H1Test>Need Repair</H1Test>
    </MainDiv>
  );
}

const MainDiv = styled.div`
  box-sizing: border-box;
  background-color: #4d5061;
  width: 100px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const H1Test = styled.h1`
  color: #ffffff;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;

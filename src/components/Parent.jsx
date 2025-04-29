"use client";

import styled from "styled-components";
import { Vehicle } from ".";

export default function AddCargo() {
  return (
    <MainDiv>
      <Vehicle />
    </MainDiv>
  );
}

const MainDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding-left: 72px;
  padding-right: 72px;
  padding-top: 24px;
  box-sizing: border-box;
`;

const CargoDiv = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: space-between;
  width: 100%;
`;

"use client";

import { Parent } from "@/components";
import styled from "styled-components";

export default function Home() {
  return (
    <MainDiv>
      <Parent />
    </MainDiv>
  );
}

const MainDiv = styled.div`
  height: calc(100vh - 64px);
  background-color: #15151a;
  width: 100%;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(40px);
`;

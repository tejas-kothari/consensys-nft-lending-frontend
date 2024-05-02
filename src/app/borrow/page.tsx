"use client";
import { Card, Form, Row, Select } from "antd";
import initialNfts from "../constants/nfts.json";
import tokens from "../constants/tokens.json";
import protocol from "../constants/protocol.json";
import { useEffect, useState } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";

export default function Borrow() {
  const { address } = useAccount();
  const [nfts, setNFTs] = useState<
    { address: string; tokenID: number; name: string; image: string }[]
  >([]);

  const ownersFetch = useReadContracts({
    contracts: initialNfts.map((v) => ({
      address: v.address as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "id",
              type: "uint256",
            },
          ],
          name: "ownerOf",
          outputs: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "ownerOf",
      args: [v.tokenID],
    })),
  });

  useEffect(() => {
    if (ownersFetch.status === "success" && address !== undefined) {
      const owners = ownersFetch.data.map((v) => v.result);
      setNFTs(
        initialNfts.filter((element, index) => owners[index] === address)
      );
    }
  }, [ownersFetch.status, address]);

  const [selectedTokenAddr, setSelectedTokenAddr] = useState(tokens[0].address);
  const { data: hash, writeContractAsync } = useWriteContract();

  const list = async (nftAddress: string, nftTokenid: number) => {
    const res = await writeContractAsync({
      address: nftAddress as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "approve",
      args: [protocol.protocol as `0x${string}`, BigInt(nftTokenid)],
    });

    await writeContractAsync({
      address: protocol.protocol as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "nft",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "denomination",
              type: "address",
            },
          ],
          name: "requestLoan",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "requestLoan",
      args: [
        nftAddress as `0x${string}`,
        BigInt(nftTokenid),
        selectedTokenAddr as `0x${string}`,
      ],
    });

    setNFTs((v) =>
      v.filter((k) => !(k.address === nftAddress && k.tokenID === nftTokenid))
    );
  };

  // const [nftMetadata, setNftMetadata] = useState({});
  // const [finishedLoading, setFinishedLoading] = useState(false);
  // const nftDataFetch = useReadContracts({
  //   contracts: Object.entries(nfts)
  //     .map((v) => [
  //       {
  //         address: v[0] as `0x${string}`,
  //         abi: [
  //           {
  //             inputs: [],
  //             name: "symbol",
  //             outputs: [
  //               {
  //                 internalType: "string",
  //                 name: "",
  //                 type: "string",
  //               },
  //             ],
  //             stateMutability: "view",
  //             type: "function",
  //           },
  //         ] as const,
  //         functionName: "symbol",
  //       },
  //       {
  //         address: v[0] as `0x${string}`,
  //         abi: [
  //           {
  //             inputs: [],
  //             name: "name",
  //             outputs: [
  //               {
  //                 internalType: "string",
  //                 name: "",
  //                 type: "string",
  //               },
  //             ],
  //             stateMutability: "view",
  //             type: "function",
  //           },
  //         ] as const,
  //         functionName: "name",
  //       },
  //       {
  //         address: v[0] as `0x${string}`,
  //         abi: [
  //           {
  //             inputs: [
  //               {
  //                 internalType: "uint256",
  //                 name: "tokenId",
  //                 type: "uint256",
  //               },
  //             ],
  //             name: "tokenURI",
  //             outputs: [
  //               {
  //                 internalType: "string",
  //                 name: "",
  //                 type: "string",
  //               },
  //             ],
  //             stateMutability: "view",
  //             type: "function",
  //           },
  //         ] as const,
  //         functionName: "tokenURI",
  //         args: [v[1]],
  //       },
  //     ])
  //     .flat(1),
  // });

  // useEffect(() => {
  //   if (nftDataFetch.status === "success") {
  //     const nftData = nftDataFetch.data.map((v) => v.result);
  //     for (let i = 0; i < nftData.length / 3; i++) {
  //       const url = nftData[i * 3 + 2]!;

  //       (async () => {
  //         const imgUrl = await fetch(url)
  //           .then((v) => v.json())
  //           .then((v) => v.image);

  //         setNftMetadata((v) => ({
  //           ...v,
  //           [Object.entries(nfts)[i][0]]: {
  //             img: imgUrl,
  //             symbol: nftData[i * 3]!,
  //             name: nftData[i * 3 + 1]!,
  //           },
  //         }));
  //       })();
  //     }
  //   }
  // }, [nftDataFetch.status]);

  return (
    <>
      <Form.Item label="Token to be borrowed:">
        <Select
          defaultValue={tokens[0].address}
          style={{ width: 120 }}
          onChange={(v, _) => setSelectedTokenAddr(v)}
          options={tokens.map((v) => ({ value: v.address, label: v.symbol }))}
        />
      </Form.Item>
      <Row gutter={[16, 16]}>
        {nfts.map((v) => (
          <Card
            title={`${v.name} #${v.tokenID}`}
            extra={<a onClick={() => list(v.address, v.tokenID)}>List</a>}
            style={{ width: 300 }}
          >
            <img src={v.image} />
          </Card>
        ))}
      </Row>
    </>
  );
}

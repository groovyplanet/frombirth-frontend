/* src/components/baby-diary/diary-list-photo/DiaryLIstBoard.jsx */

import './DiaryListBoard.css';
import {useInView} from "react-intersection-observer";
import {Fragment, useContext, useEffect, useState} from "react";
import {useInfiniteQuery} from "react-query";
import {getDiariesListInfinitely} from "../DiaryCommonFunction.js";
import Spinner from "../../common/Spinner.jsx";
import AppContext from "../../../contexts/AppProvider.jsx";
import {useNavigate} from "react-router-dom";
import {PATHS} from "../../../routes/paths.js";
import {debounce, throttle} from "lodash";
import {getDayOfWeek} from "../../../utils/Util.js";

const DiaryListBoard = () => {
    const navigate = useNavigate();
    const {selectedChildId, query} = useContext(AppContext);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    const {ref, inView} = useInView();
    const {data: diaryInfoList, fetchNextPage, isFetchingNextPage, isLoading} = useInfiniteQuery(
        ['infiniteDiaryList', selectedChildId, debouncedQuery],
        ({pageParam = 999999}) => getDiariesListInfinitely(selectedChildId, pageParam, 10, query),
        {
            getNextPageParam: (lastPage) =>
                !lastPage.isLast ? lastPage.nextLastRecordId : undefined
        }
    );

    // query 변화에 대해 debounce 적용
    useEffect(() => {
        const debounced = debounce((newQuery) => {
            setDebouncedQuery(newQuery);
        }, 500); // 500ms delay

        debounced(query);

        return () => {
            debounced.cancel();
        };
    }, [query]);

    const throttledFetchNextPage = throttle(() => {
        if (inView) fetchNextPage();
    }, 1000);

    useEffect(() => {
        throttledFetchNextPage();
        return () => throttledFetchNextPage.cancel();
    }, [inView, throttledFetchNextPage]);

    function handleViewDiary(diary) {
        navigate(PATHS.BABY_DIARY.VIEW, {state: diary});
    }

    if (isLoading) return <Spinner/>;

    return (
        <div>
            {diaryInfoList && diaryInfoList.pages.length > 0 && diaryInfoList.pages.some(page => page.data.length > 0) ? (
                diaryInfoList.pages.map((page, index) => (
                    <Fragment key={index}>
                        {page.data.map(diary =>
                            <div className="entry list" key={diary.recordId} onClick={() => handleViewDiary(diary)}>
                                <div className="entry-title">
                                    <div className="date">{`${diary.recordDate} (${getDayOfWeek(diary.recordDate)})`}</div>
                                    <h3>{diary.title}</h3>
                                </div>
                                <div className="entry-content">
                                    {diary.content}
                                </div>
                                <div className="diary-list-board-photo-box">
                                    {diary.images.map((image) => {
                                        return (
                                            image.photoId &&
                                            <img
                                                src={image.url}
                                                alt={image.photoId}
                                                key={image.photoId}
                                                className="diary-list-board-photo"
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </Fragment>
                ))
            ) : (
                <p className="no-diaries-message">등록된 일기가 없어요.</p>
            )}
            {isFetchingNextPage ? <Spinner/> : <div ref={ref}></div>}
        </div>
    );
};

export default DiaryListBoard;